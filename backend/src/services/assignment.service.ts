import { Types } from 'mongoose';
import { Assignment, IAssignment } from '../models/Assignment.js';
import { Submission, ISubmission } from '../models/Submission.js';
import { SubjectMember } from '../models/SubjectMember.js';
import { Subject } from '../models/Subject.js';
import { Notification } from '../models/Notification.js';
import { PointsService } from './points.service.js';
import { emitToSubject, emitToUser } from '../config/socket.js';

export class AssignmentService {
  static async createAssignment(
    facultyId: string,
    data: {
      classId?: string;
      subjectId: string;
      title: string;
      description?: string;
      instructions?: string;
      dueDate: string | Date;
      maxMarks?: number;
      rewardPoints?: number;
      attachments?: { fileName: string; fileUrl: string; fileSize: number }[];
      allowedFileTypes?: string[];
      maxFileSizeMb?: number;
      allowLateSubmissions?: boolean;
    }
  ): Promise<IAssignment> {
    let classId = data.classId;
    if (!classId && data.subjectId) {
      const subject = await Subject.findById(data.subjectId);
      if (subject) {
        classId = typeof subject.classId === 'object' ? (subject.classId as any)._id : subject.classId;
      }
    }

    const assignment = await Assignment.create({
      ...data,
      classId,
      dueDate: new Date(data.dueDate),
      createdBy: facultyId,
    });

    const populated = await Assignment.findById(assignment._id).populate(
      'createdBy',
      'name email avatar'
    );

    // Notify enrolled students in real-time
    emitToSubject(data.subjectId, 'assignment:created', populated);

    // Send notifications to enrolled students
    const students = await SubjectMember.find({ subjectId: data.subjectId, role: 'STUDENT' });
    const notifs = students.map((s) => ({
      recipientId: s.userId,
      senderId: new Types.ObjectId(facultyId),
      type: 'ASSIGNMENT_CREATED',
      title: 'New Assignment Posted',
      message: `"${data.title}" due on ${new Date(data.dueDate).toLocaleDateString()}`,
      referenceId: assignment._id,
    }));

    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

    return populated || assignment;
  }

  static async getAssignmentsForSubject(
    subjectId: string,
    studentId?: string
  ): Promise<any[]> {
    const assignments = await Assignment.find({ subjectId })
      .sort({ dueDate: 1 })
      .populate('createdBy', 'name email avatar');

    if (!studentId) {
      // Faculty/Admin view: attach submission count
      const assignmentIds = assignments.map((a) => a._id);
      const submissionCounts = await Submission.aggregate([
        { $match: { assignmentId: { $in: assignmentIds } } },
        { $group: { _id: '$assignmentId', count: { $sum: 1 } } },
      ]);

      return assignments.map((a) => {
        const count =
          submissionCounts.find((sc) => sc._id.toString() === a._id.toString())?.count || 0;
        return {
          ...a.toObject(),
          submissionsCount: count,
        };
      });
    }

    // Student view: attach personal submission status
    const studentSubmissions = await Submission.find({
      assignmentId: { $in: assignments.map((a) => a._id) },
      studentId,
    });

    return assignments.map((a) => {
      const submission = studentSubmissions.find(
        (s) => s.assignmentId.toString() === a._id.toString()
      );
      return {
        ...a.toObject(),
        mySubmission: submission || null,
      };
    });
  }

  static async submitAssignment(
    assignmentId: string,
    studentId: string,
    data: {
      fileUrl: string;
      fileName: string;
      fileSize: number;
      submissionText?: string;
    }
  ): Promise<ISubmission> {
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) throw new Error('Assignment not found.');

    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmissions) {
      throw new Error('Deadline has passed and late submissions are not allowed for this assignment.');
    }

    const status = isLate ? 'LATE' : 'SUBMITTED';

    // Upsert submission
    const submission = await Submission.findOneAndUpdate(
      { assignmentId, studentId },
      {
        $set: {
          classId: assignment.classId,
          subjectId: assignment.subjectId,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize,
          submissionText: data.submissionText || '',
          submittedAt: now,
          status,
        },
      },
      { upsert: true, new: true }
    );

    // Award initial completion points if first time submission
    if (submission.pointsAwarded === 0) {
      const pointsToAward = isLate ? Math.floor(assignment.rewardPoints * 0.7) : assignment.rewardPoints;
      await PointsService.awardPoints(
        studentId,
        'ASSIGNMENT',
        pointsToAward,
        `Submitted assignment: "${assignment.title}"${isLate ? ' (Late)' : ''}`,
        assignment._id
      );
      submission.pointsAwarded = pointsToAward;
      await submission.save();
    }

    return submission;
  }

  static async gradeSubmission(
    submissionId: string,
    facultyId: string,
    data: {
      marksObtained: number;
      feedback?: string;
    }
  ): Promise<ISubmission> {
    const submission = await Submission.findById(submissionId);
    if (!submission) throw new Error('Submission not found.');

    const assignment = await Assignment.findById(submission.assignmentId);
    if (!assignment) throw new Error('Assignment not found.');

    if (data.marksObtained > assignment.maxMarks) {
      throw new Error(`Marks cannot exceed maximum marks (${assignment.maxMarks}).`);
    }

    submission.marksObtained = data.marksObtained;
    submission.feedback = data.feedback || '';
    submission.status = 'GRADED';
    submission.gradedBy = new Types.ObjectId(facultyId);
    submission.gradedAt = new Date();
    await submission.save();

    // Bonus points for high score (>= 80%)
    if (data.marksObtained / assignment.maxMarks >= 0.8) {
      await PointsService.awardPoints(
        submission.studentId,
        'ASSIGNMENT',
        15,
        `Top Score Bonus on "${assignment.title}" (${data.marksObtained}/${assignment.maxMarks})`,
        assignment._id
      );
    }

    // Real-time notification to student
    const notif = await Notification.create({
      recipientId: submission.studentId,
      senderId: new Types.ObjectId(facultyId),
      type: 'ASSIGNMENT_GRADED',
      title: 'Assignment Graded',
      message: `Your submission for "${assignment.title}" was graded: ${data.marksObtained}/${assignment.maxMarks}`,
      referenceId: assignment._id,
    });

    emitToUser(submission.studentId.toString(), 'notification:new', notif);
    emitToUser(submission.studentId.toString(), 'assignment:graded', submission);

    return submission;
  }

  static async getSubmissionsForAssignment(assignmentId: string): Promise<ISubmission[]> {
    return Submission.find({ assignmentId })
      .populate('studentId', 'name email avatar studentId department')
      .populate('gradedBy', 'name email')
      .sort({ submittedAt: -1 });
  }
}
