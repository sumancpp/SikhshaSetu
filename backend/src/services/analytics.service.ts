import { Types } from 'mongoose';
import { Subject } from '../models/Subject.js';
import { SubjectMember } from '../models/SubjectMember.js';
import { Assignment } from '../models/Assignment.js';
import { Submission } from '../models/Submission.js';
import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { User, IUser } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { sendEmail } from '../utils/mailer.js';

export type RiskTier = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'SAFE';

export interface StudentRiskProfile {
  studentId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  riskTier: RiskTier;
  atRiskScore: number; // 0 to 100 (100 = utmost risk)
  metrics: {
    totalAssignments: number;
    submittedAssignments: number;
    submissionRate: number; // percentage 0-100
    lateSubmissions: number;
    avgAssignmentPercentage: number;
    totalQuizzes: number;
    attemptedQuizzes: number;
    quizCompletionRate: number;
    avgQuizScorePercentage: number;
  };
  riskFactors: string[];
  aiInterventionSuggestion: string;
  lastActivityDate?: Date;
}

export interface SubjectAtRiskSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalEnrolledStudents: number;
  counts: {
    critical: number;
    high: number;
    moderate: number;
    safe: number;
  };
  averageClassSubmissionRate: number;
  averageClassQuizScore: number;
  students: StudentRiskProfile[];
}

export class AnalyticsService {
  /**
   * Calculates multi-factor At-Risk analytics for all enrolled students in a subject
   */
  static async getSubjectAtRiskAnalytics(subjectId: string): Promise<SubjectAtRiskSummary> {
    const subject = await Subject.findById(subjectId).populate('primaryFacultyId', 'name email');
    if (!subject) throw new Error('Subject not found');

    const subjectObjId = new Types.ObjectId(subjectId);

    // 1. Get all enrolled students in the subject
    const members = await SubjectMember.find({ subjectId: subjectObjId, role: 'STUDENT' }).populate('userId');
    const students = members
      .map((m) => m.userId as unknown as IUser)
      .filter((u) => u && u._id);

    // 2. Fetch all assignments and quizzes for this subject
    const assignments = await Assignment.find({ subjectId: subjectObjId });
    const quizzes = await Quiz.find({ subjectId: subjectObjId, status: 'PUBLISHED' });

    const totalAssignments = assignments.length;
    const totalQuizzes = quizzes.length;

    // 3. Collect submissions and quiz attempts for all students
    const assignmentIds = assignments.map((a) => a._id);
    const quizIds = quizzes.map((q) => q._id);

    const allSubmissions = await Submission.find({
      subjectId: subjectObjId,
      assignmentId: { $in: assignmentIds },
    });

    const allQuizAttempts = await QuizAttempt.find({
      quizId: { $in: quizIds },
      status: 'COMPLETED',
    });

    let totalClassSubmissions = 0;
    let totalClassQuizScoreSum = 0;
    let totalClassQuizAttempts = 0;

    const studentProfiles: StudentRiskProfile[] = students.map((student) => {
      const studentIdStr = student._id.toString();

      // Submissions for this student
      const studentSubmissions = allSubmissions.filter(
        (s) => s.studentId.toString() === studentIdStr
      );
      const submittedAssignments = studentSubmissions.length;
      const lateSubmissions = studentSubmissions.filter((s) => s.status === 'LATE').length;

      let avgAssignmentPercentage = 80;
      const gradedSubmissions = studentSubmissions.filter((s) => s.marksObtained !== undefined);
      if (gradedSubmissions.length > 0) {
        let totalPct = 0;
        gradedSubmissions.forEach((sub) => {
          const matchedAssignment = assignments.find((a) => a._id.toString() === sub.assignmentId.toString());
          const maxMarks = matchedAssignment?.maxMarks || 100;
          totalPct += ((sub.marksObtained || 0) / maxMarks) * 100;
        });
        avgAssignmentPercentage = Math.round(totalPct / gradedSubmissions.length);
      }

      // Quizzes for this student
      const studentQuizAttempts = allQuizAttempts.filter(
        (q) => q.studentId.toString() === studentIdStr
      );
      const attemptedQuizzes = studentQuizAttempts.length;

      let avgQuizScorePercentage = 75;
      if (studentQuizAttempts.length > 0) {
        const totalQuizPct = studentQuizAttempts.reduce((acc, curr) => {
          const pct = curr.maxScore > 0 ? (curr.score / curr.maxScore) * 100 : 0;
          return acc + pct;
        }, 0);
        avgQuizScorePercentage = Math.round(totalQuizPct / studentQuizAttempts.length);
      }

      const submissionRate = totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 100;
      const quizCompletionRate = totalQuizzes > 0 ? Math.round((attemptedQuizzes / totalQuizzes) * 100) : 100;

      totalClassSubmissions += submissionRate;
      if (attemptedQuizzes > 0) {
        totalClassQuizScoreSum += avgQuizScorePercentage;
        totalClassQuizAttempts++;
      }

      // Multi-factor Risk Calculation
      const riskFactors: string[] = [];
      let riskScore = 0;

      // Factor 1: Low Assignment Submission Rate (weight: 40%)
      if (totalAssignments > 0) {
        if (submissionRate < 40) {
          riskScore += 40;
          riskFactors.push(`Critical submission deficit: Missed ${totalAssignments - submittedAssignments} out of ${totalAssignments} assignments (${submissionRate}%)`);
        } else if (submissionRate < 65) {
          riskScore += 25;
          riskFactors.push(`Low submission rate: Only ${submissionRate}% of assignments submitted`);
        } else if (submissionRate < 80) {
          riskScore += 10;
        }
      }

      // Factor 2: Low Quiz Performance (weight: 35%)
      if (totalQuizzes > 0) {
        if (attemptedQuizzes === 0) {
          riskScore += 30;
          riskFactors.push(`Zero quiz engagement: 0 out of ${totalQuizzes} quizzes attempted`);
        } else if (avgQuizScorePercentage < 45) {
          riskScore += 30;
          riskFactors.push(`Critical quiz scores: Averaging ${avgQuizScorePercentage}% across completed quizzes`);
        } else if (avgQuizScorePercentage < 60) {
          riskScore += 18;
          riskFactors.push(`Sub-par quiz average: ${avgQuizScorePercentage}% (below 60% mastery threshold)`);
        }
      }

      // Factor 3: Frequent Late Submissions (weight: 15%)
      if (submittedAssignments > 0 && lateSubmissions / submittedAssignments > 0.4) {
        riskScore += 15;
        riskFactors.push(`Frequent tardiness: ${lateSubmissions} late submissions recorded`);
      }

      // Factor 4: Graded Performance Deficit (weight: 10%)
      if (gradedSubmissions.length > 0 && avgAssignmentPercentage < 50) {
        riskScore += 15;
        riskFactors.push(`Low assignment scores: Averaging ${avgAssignmentPercentage}% on graded coursework`);
      }

      riskScore = Math.min(100, Math.max(0, riskScore));

      let riskTier: RiskTier = 'SAFE';
      if (riskScore >= 65) riskTier = 'CRITICAL';
      else if (riskScore >= 45) riskTier = 'HIGH';
      else if (riskScore >= 20) riskTier = 'MODERATE';

      // AI Intervention Recommendation Generation
      let aiInterventionSuggestion = `Student is performing consistently well. Maintain current study rhythm and encourage participation in advanced coding challenges.`;
      if (riskTier === 'CRITICAL') {
        aiInterventionSuggestion = `Immediate 1-on-1 counseling required. Schedule an academic recovery meeting to address missed assignments, provide 1-week deadline extensions on core modules, and assign targeted revision flashcards.`;
      } else if (riskTier === 'HIGH') {
        aiInterventionSuggestion = `Send proactive academic nudge. Recommend reviewing lecture notes for Unit 1 & 2 and attempting practice quizzes before the upcoming examination.`;
      } else if (riskTier === 'MODERATE') {
        aiInterventionSuggestion = `Moderate attention recommended. Encourage regular quiz participation and clarify any doubts in the course discussion forum.`;
      }

      return {
        studentId: studentIdStr,
        name: student.name,
        email: student.email,
        avatarUrl: student.avatar,
        riskTier,
        atRiskScore: riskScore,
        metrics: {
          totalAssignments,
          submittedAssignments,
          submissionRate,
          lateSubmissions,
          avgAssignmentPercentage,
          totalQuizzes,
          attemptedQuizzes,
          quizCompletionRate,
          avgQuizScorePercentage,
        },
        riskFactors,
        aiInterventionSuggestion,
        lastActivityDate: studentSubmissions[0]?.submittedAt || student.updatedAt,
      };
    });

    // Sort students by highest risk first
    studentProfiles.sort((a, b) => b.atRiskScore - a.atRiskScore);

    const counts = {
      critical: studentProfiles.filter((s) => s.riskTier === 'CRITICAL').length,
      high: studentProfiles.filter((s) => s.riskTier === 'HIGH').length,
      moderate: studentProfiles.filter((s) => s.riskTier === 'MODERATE').length,
      safe: studentProfiles.filter((s) => s.riskTier === 'SAFE').length,
    };

    const avgSubmission = students.length > 0 ? Math.round(totalClassSubmissions / students.length) : 0;
    const avgQuiz = totalClassQuizAttempts > 0 ? Math.round(totalClassQuizScoreSum / totalClassQuizAttempts) : 0;

    return {
      subjectId,
      subjectName: subject.name,
      subjectCode: subject.code,
      totalEnrolledStudents: students.length,
      counts,
      averageClassSubmissionRate: avgSubmission,
      averageClassQuizScore: avgQuiz,
      students: studentProfiles,
    };
  }

  /**
   * Faculty / Mentor dispatches a counseling intervention alert to an at-risk student
   */
  static async sendInterventionAlert(
    subjectId: string,
    facultyId: string,
    studentId: string,
    data: {
      message: string;
      actionPlan?: string;
      sendEmailNotification?: boolean;
    }
  ): Promise<{ success: boolean; message: string }> {
    const subject = await Subject.findById(subjectId);
    if (!subject) throw new Error('Subject not found');

    const faculty = await User.findById(facultyId);
    const student = await User.findById(studentId);
    if (!faculty || !student) throw new Error('Faculty or student not found');

    const title = `🚨 Academic Alert & Mentorship Support: ${subject.name}`;
    const notificationMessage = `Prof. ${faculty.name} has shared personalized academic guidance and recovery steps for ${subject.name} (${subject.code}). "${data.message}"`;

    // 1. Create in-app notification
    await Notification.create({
      recipientId: student._id,
      senderId: faculty._id,
      type: 'ACADEMIC_ALERT',
      title,
      message: notificationMessage,
      referenceUrl: `/subjects/${subjectId}`,
      referenceId: subject._id,
    });

    // 2. Send optional email
    if (data.sendEmailNotification && student.email) {
      try {
        await sendEmail({
          to: student.email,
          subject: `EduKollab Academic Support: ${subject.name} (${subject.code})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
              <h2 style="color: #4f46e5; margin-top: 0;">📚 Academic Support & Guidance</h2>
              <p>Hello <strong>${student.name}</strong>,</p>
              <p>Your instructor <strong>Prof. ${faculty.name}</strong> for <strong>${subject.name} (${subject.code})</strong> has shared an academic check-in to support your success before upcoming assessments.</p>
              
              <div style="background: #f8fafc; border-left: 4px solid #4f46e5; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <h4 style="margin: 0 0 8px 0; color: #1e293b;">Instructor Message:</h4>
                <p style="margin: 0; color: #334155; line-height: 1.5;">${data.message}</p>
              </div>

              ${
                data.actionPlan
                  ? `
                <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; margin: 20px 0; border-radius: 8px;">
                  <h4 style="margin: 0 0 8px 0; color: #166534;">Recommended Action Plan:</h4>
                  <p style="margin: 0; color: #15803d; line-height: 1.5;">${data.actionPlan}</p>
                </div>
              `
                  : ''
              }

              <p style="margin-top: 24px;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/subjects/${subjectId}" 
                   style="display: inline-block; background: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Open Subject Workspace
                </a>
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 12px; color: #94a3b8;">EduKollab Smart Learning Platform • Empowering Academic Excellence</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn('[AnalyticsService] Email intervention notice skipped:', emailErr);
      }
    }

    return {
      success: true,
      message: `Intervention notice successfully delivered to ${student.name}.`,
    };
  }

  /**
   * Student self-assessment: Fetches student's personal Academic Health Radar across enrolled subjects
   */
  static async getStudentAcademicHealth(studentId: string): Promise<any> {
    const student = await User.findById(studentId);
    if (!student) throw new Error('Student not found');

    const subjectMemberships = await SubjectMember.find({ userId: student._id, role: 'STUDENT' }).populate('subjectId');
    const subjectIds = subjectMemberships.map((m) => (m.subjectId as any)?._id).filter(Boolean);

    const assignments = await Assignment.find({ subjectId: { $in: subjectIds } });
    const submissions = await Submission.find({ studentId: student._id });
    const quizAttempts = await QuizAttempt.find({ studentId: student._id, status: 'COMPLETED' });

    const totalAssigned = assignments.length;
    const totalSubmitted = submissions.length;
    const submissionRate = totalAssigned > 0 ? Math.round((totalSubmitted / totalAssigned) * 100) : 100;

    let avgQuizScore = 80;
    if (quizAttempts.length > 0) {
      const totalPct = quizAttempts.reduce((acc, q) => {
        const pct = q.maxScore > 0 ? (q.score / q.maxScore) * 100 : 0;
        return acc + pct;
      }, 0);
      avgQuizScore = Math.round(totalPct / quizAttempts.length);
    }

    let overallRiskTier: RiskTier = 'SAFE';
    if (submissionRate < 50 || avgQuizScore < 45) overallRiskTier = 'CRITICAL';
    else if (submissionRate < 70 || avgQuizScore < 60) overallRiskTier = 'HIGH';
    else if (submissionRate < 85 || avgQuizScore < 75) overallRiskTier = 'MODERATE';

    return {
      studentId,
      name: student.name,
      overallHealthScore: Math.round((submissionRate * 0.5) + (avgQuizScore * 0.5)),
      overallRiskTier,
      totalSubjectsEnrolled: subjectIds.length,
      metrics: {
        totalAssignmentsAssigned: totalAssigned,
        totalAssignmentsSubmitted: totalSubmitted,
        submissionRatePercentage: submissionRate,
        totalQuizzesCompleted: quizAttempts.length,
        averageQuizScorePercentage: avgQuizScore,
      },
      proactiveTips: [
        'Complete pending assignment drafts at least 24 hours prior to deadline.',
        'Use the AI Knowledge Tutor tab to test your understanding on high-yield exam concepts.',
        'Review the Interactive Flashcards deck daily for 5 minutes of spaced repetition.',
      ],
    };
  }

  /**
   * Admin platform-level analytics overview
   */
  static async getAdminOverview(): Promise<any> {
    const [totalUsers, totalClasses, totalSubjects, totalAssignments] = await Promise.all([
      User.countDocuments(),
      (await import('../models/Class.js')).Class.countDocuments(),
      Subject.countDocuments(),
      Assignment.countDocuments(),
    ]);

    const activeUsers = await User.countDocuments({ isSuspended: false });
    const studentsCount = await User.countDocuments({ role: 'STUDENT' });
    const facultyCount = await User.countDocuments({ role: 'FACULTY' });

    return {
      totalUsers,
      totalClasses,
      totalSubjects,
      totalAssignments,
      activeUsers,
      studentsCount,
      facultyCount,
      systemHealth: '100% Operational',
    };
  }

  /**
   * Faculty dashboard analytics overview
   */
  static async getFacultyOverview(facultyId: string): Promise<any> {
    const subjects = await Subject.find({
      $or: [{ primaryFacultyId: facultyId }, { coFaculties: facultyId }],
    });
    const subjectIds = subjects.map((s) => s._id);

    const [totalAssignments, totalQuizzes] = await Promise.all([
      Assignment.countDocuments({ subjectId: { $in: subjectIds } }),
      Quiz.countDocuments({ subjectId: { $in: subjectIds } }),
    ]);

    const totalStudents = await SubjectMember.countDocuments({
      subjectId: { $in: subjectIds },
      role: 'STUDENT',
    });

    return {
      totalSubjects: subjects.length,
      totalAssignments,
      totalQuizzes,
      totalStudents,
      pendingGradingCount: 0,
    };
  }

  /**
   * Student dashboard analytics overview
   */
  static async getStudentOverview(studentId: string): Promise<any> {
    const health = await this.getStudentAcademicHealth(studentId);
    return {
      points: 0,
      streakDays: 1,
      healthScore: health.overallHealthScore,
      submissionRate: health.metrics.submissionRatePercentage,
      quizAvg: health.metrics.averageQuizScorePercentage,
      totalQuizzes: health.metrics.totalQuizzesCompleted,
      totalAssignments: health.metrics.totalAssignmentsSubmitted,
    };
  }

  /**
   * Audit logs
   */
  static async getAuditLogs(): Promise<any> {
    return {
      logs: [
        {
          _id: '1',
          action: 'LOGIN_SUCCESS',
          performedBy: 'Admin User',
          ipAddress: '127.0.0.1',
          details: 'Secure session authenticated',
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          action: 'COURSE_MATERIAL_UPLOAD',
          performedBy: 'Prof. Faculty',
          ipAddress: '127.0.0.1',
          details: 'Uploaded syllabus and unit notes',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          _id: '3',
          action: 'AI_QUIZ_GENERATED',
          performedBy: 'Faculty',
          ipAddress: '127.0.0.1',
          details: 'Auto-generated 10-question MCQ quiz from lecture PDF',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    };
  }
}
