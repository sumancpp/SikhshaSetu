import { Types } from 'mongoose';
import { Subject, ISubject, IFacultyPermission } from '../models/Subject.js';
import { SubjectMember } from '../models/SubjectMember.js';
import { ClassMember } from '../models/ClassMember.js';
import { Class } from '../models/Class.js';
import { User, UserRole } from '../models/User.js';
import { Material } from '../models/Material.js';
import { Assignment } from '../models/Assignment.js';
import { Quiz } from '../models/Quiz.js';
import { Challenge } from '../models/Challenge.js';
import { ForumPost } from '../models/ForumPost.js';
import { Notification } from '../models/Notification.js';
import { AssignmentService } from './assignment.service.js';
import { QuizService } from './quiz.service.js';
import { emitToSubject, emitToUser, emitGlobal } from '../config/socket.js';

export class SubjectService {
  static async createSubject(
    facultyId: string,
    data: {
      classId: string;
      name: string;
      code: string;
      description?: string;
      subjectImage?: string;
      semester: number;
      credits?: number;
    }
  ): Promise<ISubject> {
    const classExists = await Class.findById(data.classId);
    if (!classExists) throw new Error('Parent Class does not exist.');

    // Ensure Faculty is member of class
    await ClassMember.findOneAndUpdate(
      { classId: data.classId, userId: facultyId },
      { $setOnInsert: { classId: data.classId, userId: facultyId, role: 'FACULTY' } },
      { upsert: true }
    );

    const subject = await Subject.create({
      ...data,
      code: data.code.toUpperCase().trim(),
      primaryFacultyId: facultyId,
      coFaculties: [],
      facultyPermissions: [
        {
          facultyId: new Types.ObjectId(facultyId),
          manageMaterials: true,
          createAssignments: true,
          gradeAssignments: true,
          createChallenges: true,
          moderateForum: true,
        },
      ],
    });

    // Add Primary Faculty as SubjectMember
    await SubjectMember.create({
      subjectId: subject._id,
      classId: data.classId,
      userId: facultyId,
      role: 'FACULTY',
    });

    // Auto-enroll all existing students of the parent class into the new subject
    const classStudents = await ClassMember.find({ classId: data.classId, role: 'STUDENT' });
    if (classStudents.length > 0) {
      const studentDocs = classStudents.map((cs) => ({
        subjectId: subject._id,
        classId: data.classId,
        userId: cs.userId,
        role: 'STUDENT',
      }));
      await SubjectMember.insertMany(studentDocs, { ordered: false }).catch(() => {});
    }

    emitGlobal('subject:created', subject);
    return subject;
  }

  static async updateSubject(subjectId: string, data: Partial<ISubject>): Promise<ISubject | null> {
    const updated = await Subject.findByIdAndUpdate(subjectId, { $set: data }, { new: true });
    return updated;
  }

  static async addCoFaculty(
    subjectId: string,
    primaryFacultyId: string,
    coFacultyId: string,
    permissions?: Partial<IFacultyPermission>
  ): Promise<ISubject> {
    const subject = await Subject.findById(subjectId);
    if (!subject) throw new Error('Subject not found.');

    if (subject.primaryFacultyId.toString() !== primaryFacultyId) {
      throw new Error('Only the primary subject faculty can invite co-faculties.');
    }

    const coFaculty = await User.findById(coFacultyId);
    if (!coFaculty) throw new Error('Faculty user not found.');

    if (!subject.coFaculties.some((id) => id.toString() === coFacultyId)) {
      subject.coFaculties.push(new Types.ObjectId(coFacultyId));
    }

    const existingPermIndex = subject.facultyPermissions.findIndex(
      (p) => p.facultyId.toString() === coFacultyId
    );

    const defaultPerms: IFacultyPermission = {
      facultyId: new Types.ObjectId(coFacultyId),
      manageMaterials: permissions?.manageMaterials ?? true,
      createAssignments: permissions?.createAssignments ?? true,
      gradeAssignments: permissions?.gradeAssignments ?? true,
      createChallenges: permissions?.createChallenges ?? true,
      moderateForum: permissions?.moderateForum ?? true,
    };

    if (existingPermIndex >= 0) {
      subject.facultyPermissions[existingPermIndex] = defaultPerms;
    } else {
      subject.facultyPermissions.push(defaultPerms);
    }

    await subject.save();

    // Ensure member records in Class and Subject
    await ClassMember.findOneAndUpdate(
      { classId: subject.classId, userId: coFacultyId },
      { $setOnInsert: { classId: subject.classId, userId: coFacultyId, role: 'FACULTY' } },
      { upsert: true }
    );

    await SubjectMember.findOneAndUpdate(
      { subjectId: subject._id, userId: coFacultyId },
      { $setOnInsert: { subjectId: subject._id, classId: subject.classId, userId: coFacultyId, role: 'FACULTY' } },
      { upsert: true }
    );

    const notif = await Notification.create({
      recipientId: coFacultyId,
      senderId: primaryFacultyId,
      type: 'SUBJECT_INVITE',
      title: 'Co-Faculty Assignment',
      message: `You have been added as Co-Faculty to subject "${subject.name}" (${subject.code}).`,
      referenceId: subject._id,
    });

    emitToUser(coFacultyId, 'notification:new', notif);

    return subject;
  }

  static async enrollStudent(subjectId: string, studentIdOrEmail: string): Promise<void> {
    const subject = await Subject.findById(subjectId);
    if (!subject) throw new Error('Subject not found.');

    const trimmed = studentIdOrEmail.trim();
    let student = await User.findOne({
      $or: [
        ...(Types.ObjectId.isValid(trimmed) ? [{ _id: trimmed }] : []),
        { email: trimmed.toLowerCase() },
        { studentId: trimmed },
      ],
    });

    if (!student) throw new Error('Student not found with that email, student ID, or user ID.');

    // Ensure class membership
    await ClassMember.findOneAndUpdate(
      { classId: subject.classId, userId: student._id },
      { $setOnInsert: { classId: subject.classId, userId: student._id, role: 'STUDENT' } },
      { upsert: true }
    );

    // Subject membership
    await SubjectMember.findOneAndUpdate(
      { subjectId: subject._id, userId: student._id },
      { $setOnInsert: { subjectId: subject._id, classId: subject.classId, userId: student._id, role: 'STUDENT' } },
      { upsert: true }
    );
  }

  static async getSubjectsForUser(userId: string, role: UserRole, classId?: string): Promise<any[]> {
    if (role === 'ADMIN') {
      const filter: any = { isArchived: false };
      if (classId) filter.classId = classId;
      return Subject.find(filter)
        .populate('classId', 'name code')
        .populate('primaryFacultyId', 'name email avatar')
        .sort({ createdAt: -1 });
    }

    const memberFilter: any = { userId };
    if (classId) memberFilter.classId = classId;

    const memberships = await SubjectMember.find(memberFilter);
    const subjectIds = memberships.map((m) => m.subjectId);

    return Subject.find({ _id: { $in: subjectIds }, isArchived: false })
      .populate('classId', 'name code')
      .populate('primaryFacultyId', 'name email avatar')
      .sort({ createdAt: -1 });
  }

  static async getSubjectWorkspace(subjectId: string, userId?: string, userRole?: string): Promise<any> {
    const subject = await Subject.findById(subjectId)
      .populate('classId', 'name code academicYear department')
      .populate('primaryFacultyId', 'name email avatar bio department')
      .populate('coFaculties', 'name email avatar');

    if (!subject) throw new Error('Subject not found.');

    const classId = typeof subject.classId === 'object' ? (subject.classId as any)._id : subject.classId;

    // Auto-sync any student & faculty members from parent class into this subject
    if (classId) {
      const classMembers = await ClassMember.find({ classId });
      for (const cm of classMembers) {
        await SubjectMember.findOneAndUpdate(
          { subjectId: subject._id, userId: cm.userId },
          { $setOnInsert: { subjectId: subject._id, classId, userId: cm.userId, role: cm.role } },
          { upsert: true }
        );
      }
    }

    const isStudent = userRole === 'STUDENT';
    const studentId = isStudent ? userId : undefined;

    const [materials, assignments, quizzes, challenges, forumPosts, members] =
      await Promise.all([
        Material.find({ subjectId }).sort({ createdAt: -1 }).populate('uploadedBy', 'name email avatar role'),
        AssignmentService.getAssignmentsForSubject(subjectId, studentId),
        QuizService.getQuizzesForSubject(subjectId, studentId),
        Challenge.find({ $or: [{ subjectId }, { subjectId: null }], isActive: true }).sort({ createdAt: -1 }),
        ForumPost.find({ $or: [{ subjectId }, { classId: subject.classId, subjectId: null }], isHidden: false })
          .sort({ createdAt: -1 })
          .populate('authorId', 'name email avatar role'),
        SubjectMember.find({ subjectId }).populate('userId', 'name email avatar role studentId department points streakDays'),
      ]);

    const faculties = members
      .filter((m) => m.role === 'FACULTY' && m.userId)
      .map((m) => m.userId);

    const students = members
      .filter((m) => m.role === 'STUDENT' && m.userId)
      .map((m) => m.userId);

    // If primary faculty is not in faculties list, include primary faculty
    if (
      subject.primaryFacultyId &&
      !faculties.some(
        (f: any) => f?._id?.toString() === (subject.primaryFacultyId as any)?._id?.toString()
      )
    ) {
      faculties.unshift(subject.primaryFacultyId);
    }

    return {
      subject,
      materials,
      assignments,
      quizzes,
      challenges,
      forumPosts,
      members,
      faculties,
      students,
      counts: {
        materials: materials.length,
        assignments: assignments.length,
        quizzes: quizzes.length,
        challenges: challenges.length,
        forumPosts: forumPosts.length,
        totalStudents: students.length,
        totalFaculties: faculties.length,
      },
    };
  }

  static async getSubjectLeaderboard(subjectId: string): Promise<any[]> {
    const members = await SubjectMember.find({ subjectId, role: 'STUDENT' }).populate(
      'userId',
      'name email avatar department studentId points streakDays'
    );

    const validStudents = members
      .map((m) => m.userId as any)
      .filter((u) => u && !u.isSuspended)
      .sort((a, b) => b.points - a.points);

    // Calculate tie-aware ranks: (1, 2, 2, 4)
    let currentRank = 1;
    return validStudents.map((student, index, array) => {
      if (index > 0 && student.points < array[index - 1].points) {
        currentRank = index + 1;
      }
      return {
        rank: currentRank,
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          avatar: student.avatar,
          studentId: student.studentId,
          department: student.department,
          points: student.points,
          streakDays: student.streakDays,
        },
      };
    });
  }
}
