import { Types } from 'mongoose';
import { Quiz, IQuiz } from '../models/Quiz.js';
import { QuizAttempt, IQuizAttempt } from '../models/QuizAttempt.js';
import { Subject } from '../models/Subject.js';
import { PointsService } from './points.service.js';
import { emitToSubject, emitToUser } from '../config/socket.js';
import { SubjectMember } from '../models/SubjectMember.js';
import { Notification } from '../models/Notification.js';

export class QuizService {
  static async createQuiz(facultyId: string, data: any): Promise<IQuiz> {
    let totalMarks = 0;
    if (data.questions && Array.isArray(data.questions)) {
      totalMarks = data.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
    }

    let classId = data.classId;
    if (!classId && data.subjectId) {
      const subject = await Subject.findById(data.subjectId);
      if (subject) {
        classId = typeof subject.classId === 'object' ? (subject.classId as any)._id : subject.classId;
      }
    }

    const quiz = await Quiz.create({
      ...data,
      classId,
      totalMarks,
      createdBy: facultyId,
    });

    const populated = await Quiz.findById(quiz._id).populate('createdBy', 'name email avatar');

    emitToSubject(data.subjectId, 'quiz:created', populated);

    // Notify students
    const students = await SubjectMember.find({ subjectId: data.subjectId, role: 'STUDENT' });
    const notifs = students.map((s) => ({
      recipientId: s.userId,
      senderId: new Types.ObjectId(facultyId),
      type: 'QUIZ_CREATED',
      title: 'New Quiz Available',
      message: `"${data.title}" is now open for practice.`,
      referenceId: quiz._id,
    }));

    if (notifs.length > 0) {
      await Notification.insertMany(notifs);
    }

    return populated || quiz;
  }

  static async getQuizzesForSubject(subjectId: string, studentId?: string): Promise<any[]> {
    const quizzes = await Quiz.find({ subjectId, isPublished: true })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar');

    if (!studentId) {
      // Faculty/Admin view: calculate total student attempts per quiz
      const attemptCounts = await QuizAttempt.aggregate([
        { $match: { quizId: { $in: quizzes.map((q) => q._id) }, status: 'COMPLETED' } },
        { $group: { _id: '$quizId', count: { $sum: 1 } } },
      ]);

      return quizzes.map((q) => {
        const count =
          attemptCounts.find((ac) => ac._id.toString() === q._id.toString())?.count || 0;
        return {
          ...q.toObject(),
          attemptsCount: count,
        };
      });
    }

    // Student view: attach student's single attempt record
    const attempts = await QuizAttempt.find({
      quizId: { $in: quizzes.map((q) => q._id) },
      studentId,
      status: 'COMPLETED',
    });

    return quizzes.map((q) => {
      const myAttempt = attempts.find((a) => a.quizId.toString() === q._id.toString());
      return {
        ...q.toObject(),
        attemptsCount: myAttempt ? 1 : 0,
        bestScore: myAttempt ? myAttempt.score : null,
        myAttempt: myAttempt || null,
        status: myAttempt ? 'COMPLETED' : 'AVAILABLE',
      };
    });
  }

  static async getQuizDetails(quizId: string, isStudent: boolean = false): Promise<any> {
    const quiz = await Quiz.findById(quizId).populate('createdBy', 'name email avatar');
    if (!quiz) throw new Error('Quiz not found.');

    if (isStudent) {
      // Hide correct answers from student before submission
      const sanitizedQuestions = quiz.questions.map((q, idx) => ({
        questionIndex: idx,
        questionText: q.questionText,
        type: q.type,
        marks: q.marks,
        options: q.options.map((opt) => ({ text: opt.text })), // omit isCorrect
      }));

      return {
        ...quiz.toObject(),
        questions: sanitizedQuestions,
      };
    }

    return quiz;
  }

  static async submitQuizAttempt(
    quizId: string,
    studentId: string,
    answers: { questionIndex: number; selectedOptionIndices: number[]; shortAnswerText?: string }[]
  ): Promise<any> {
    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new Error('Quiz not found.');

    // Strict single attempt rule: check if student has already completed this quiz
    const existingAttempt = await QuizAttempt.findOne({
      quizId,
      studentId,
      status: 'COMPLETED',
    });

    if (existingAttempt) {
      throw new Error('You have already submitted your answers for this quiz. Only one attempt is permitted.');
    }

    let calculatedScore = 0;
    const evaluatedAnswers = quiz.questions.map((question, qIdx) => {
      const userAns = answers.find((a) => a.questionIndex === qIdx);
      const selected = userAns?.selectedOptionIndices || [];
      let isCorrect = false;

      if (question.type === 'MCQ' || question.type === 'TF') {
        const correctOptIdx = question.options.findIndex((opt) => opt.isCorrect);
        isCorrect = selected.length === 1 && selected[0] === correctOptIdx;
      } else if (question.type === 'MULTIPLE') {
        const correctIndices = question.options
          .map((opt, idx) => (opt.isCorrect ? idx : -1))
          .filter((idx) => idx !== -1);
        isCorrect =
          selected.length === correctIndices.length &&
          selected.every((idx) => correctIndices.includes(idx));
      }

      const marksObtained = isCorrect ? question.marks : 0;
      calculatedScore += marksObtained;

      return {
        questionIndex: qIdx,
        selectedOptionIndices: selected,
        shortAnswerText: userAns?.shortAnswerText || '',
        isCorrect,
        marksObtained,
        explanation: question.explanation,
        correctOptionIndices: question.options
          .map((opt, idx) => (opt.isCorrect ? idx : -1))
          .filter((idx) => idx !== -1),
      };
    });

    const maxScore = quiz.totalMarks || (quiz.questions?.length ? quiz.questions.reduce((s: number, q: any) => s + (q.marks || 1), 0) : 1);
    const isPerfect = calculatedScore === maxScore && maxScore > 0;

    // Calculate points: baseline + proportional + perfect bonus
    let pointsAwarded = Math.round((calculatedScore / maxScore) * quiz.rewardPoints);
    if (isPerfect) pointsAwarded += 25; // Perfect score bonus

    const attempt = await QuizAttempt.create({
      quizId: quiz._id,
      subjectId: quiz.subjectId,
      classId: quiz.classId,
      studentId,
      attemptNumber: 1,
      startedAt: new Date(Date.now() - (quiz.timeLimitMinutes * 60 * 1000) / 2),
      submittedAt: new Date(),
      score: calculatedScore,
      maxScore,
      pointsAwarded,
      answers: evaluatedAnswers,
      status: 'COMPLETED',
    });

    // Award Points
    if (pointsAwarded > 0) {
      await PointsService.awardPoints(
        studentId,
        'QUIZ',
        pointsAwarded,
        `Completed Quiz "${quiz.title}" (${calculatedScore}/${maxScore})`,
        quiz._id
      );
    }

    return {
      attemptId: attempt._id,
      score: calculatedScore,
      maxScore,
      pointsAwarded,
      isPerfect,
      evaluatedAnswers,
    };
  }

  static async getQuizResults(quizId: string): Promise<any> {
    const quiz = await Quiz.findById(quizId).populate('createdBy', 'name email avatar');
    if (!quiz) throw new Error('Quiz not found.');

    const attempts = await QuizAttempt.find({ quizId, status: 'COMPLETED' })
      .populate('studentId', 'name email avatar studentId department points')
      .sort({ score: -1, submittedAt: 1 });

    const totalAttempts = attempts.length;
    const maxMarks = quiz.totalMarks || (quiz.questions?.length ? quiz.questions.reduce((s: number, q: any) => s + (q.marks || 1), 0) : 1);

    let totalScoreSum = 0;
    let highestScore = 0;
    let passedCount = 0;

    const formattedAttempts = attempts.map((att) => {
      totalScoreSum += att.score;
      if (att.score > highestScore) highestScore = att.score;
      const percentage = maxMarks > 0 ? Math.round((att.score / maxMarks) * 100) : 0;
      const passed = percentage >= 40;
      if (passed) passedCount++;

      return {
        _id: att._id,
        student: att.studentId,
        score: att.score,
        maxScore: att.maxScore || maxMarks,
        percentage,
        passed,
        pointsAwarded: att.pointsAwarded,
        startedAt: att.startedAt,
        submittedAt: att.submittedAt,
        answers: att.answers,
      };
    });

    const averageScore = totalAttempts > 0 ? Number((totalScoreSum / totalAttempts).toFixed(1)) : 0;
    const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 0;

    return {
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        totalMarks: maxMarks,
        rewardPoints: quiz.rewardPoints,
        timeLimitMinutes: quiz.timeLimitMinutes,
        type: quiz.type,
        questionsCount: quiz.questions?.length || 0,
        createdBy: quiz.createdBy,
        createdAt: quiz.createdAt,
      },
      stats: {
        totalAttempts,
        averageScore,
        highestScore,
        passRate,
        maxMarks,
      },
      attempts: formattedAttempts,
    };
  }
}
