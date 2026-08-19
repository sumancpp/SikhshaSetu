import crypto from 'crypto';
import { Types } from 'mongoose';
import { Class, IClass } from '../models/Class.js';
import { ClassMember } from '../models/ClassMember.js';
import { Subject } from '../models/Subject.js';
import { SubjectMember } from '../models/SubjectMember.js';
import { User, UserRole } from '../models/User.js';
import { Invitation } from '../models/Invitation.js';
import { Notification } from '../models/Notification.js';
import { emitToUser, emitGlobal } from '../config/socket.js';
import { PointsService } from './points.service.js';

export class ClassService {
  static generateClassCode(dept: string, year: string): string {
    const cleanDept = dept.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) || 'CLS';
    const cleanYear = year.replace(/[^0-9]/g, '').slice(-2) || '26';
    const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${cleanDept}${cleanYear}-${randomHex}`;
  }

  static async createClass(
    adminId: string,
    data: {
      name: string;
      description?: string;
      academicYear: string;
      department: string;
      semester: number;
      section?: string;
      bannerImage?: string;
    }
  ): Promise<IClass> {
    const code = this.generateClassCode(data.department, data.academicYear);

    const newClass = await Class.create({
      ...data,
      code,
      createdBy: adminId,
    });

    // Auto-add Admin as class member
    await ClassMember.create({
      classId: newClass._id,
      userId: adminId,
      role: 'ADMIN',
    });

    emitGlobal('class:created', newClass);
    return newClass;
  }

  static async updateClass(classId: string, data: Partial<IClass>): Promise<IClass | null> {
    const updated = await Class.findByIdAndUpdate(classId, { $set: data }, { new: true });
    return updated;
  }

  static async regenerateCode(classId: string): Promise<string> {
    const cls = await Class.findById(classId);
    if (!cls) throw new Error('Class not found.');

    const newCode = this.generateClassCode(cls.department, cls.academicYear);
    cls.code = newCode;
    await cls.save();

    return newCode;
  }

  static async joinClassByCode(
    userId: string,
    code: string,
    role: UserRole = 'STUDENT'
  ): Promise<{ class: IClass; message: string }> {
    const cls = await Class.findOne({ code: code.toUpperCase().trim(), isArchived: false });
    if (!cls) {
      throw new Error('Invalid class join code or class has been archived.');
    }

    const existing = await ClassMember.findOne({ classId: cls._id, userId });
    if (existing) {
      return { class: cls, message: 'You are already a member of this class.' };
    }

    await ClassMember.create({
      classId: cls._id,
      userId,
      role,
    });

    // Auto-enroll student into active subjects of this class
    if (role === 'STUDENT') {
      const subjects = await Subject.find({ classId: cls._id, isArchived: false });
      for (const subject of subjects) {
        await SubjectMember.findOneAndUpdate(
          { subjectId: subject._id, userId },
          { $setOnInsert: { subjectId: subject._id, classId: cls._id, userId, role: 'STUDENT' } },
          { upsert: true }
        );
      }
    }

    await PointsService.checkAndAwardAchievements(userId, 0);

    return { class: cls, message: `Successfully joined ${cls.name}!` };
  }

  static async inviteFaculty(
    classId: string,
    invitedById: string,
    email: string
  ): Promise<{ message: string; invitation?: any }> {
    const cls = await Class.findById(classId);
    if (!cls) throw new Error('Class not found.');

    const cleanEmail = email.toLowerCase().trim();
    const existingFaculty = await User.findOne({ email: cleanEmail });

    if (existingFaculty) {
      // If user exists, directly add to ClassMember as Faculty
      await ClassMember.findOneAndUpdate(
        { classId: cls._id, userId: existingFaculty._id },
        { $set: { role: 'FACULTY' } },
        { upsert: true }
      );

      const notif = await Notification.create({
        recipientId: existingFaculty._id,
        senderId: invitedById,
        type: 'CLASS_INVITE',
        title: 'Assigned to Class',
        message: `You have been added as Faculty to class "${cls.name}" (${cls.code}).`,
        referenceId: cls._id,
      });

      emitToUser(existingFaculty._id.toString(), 'notification:new', notif);

      return { message: `Faculty ${existingFaculty.name} has been added to class.` };
    }

    // Otherwise create secure random invitation token
    const token = crypto.randomBytes(24).toString('hex');
    const invitation = await Invitation.create({
      token,
      email: cleanEmail,
      classId: cls._id,
      role: 'FACULTY',
      invitedBy: invitedById,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      message: `Invitation generated for ${cleanEmail}.`,
      invitation: {
        token: invitation.token,
        email: invitation.email,
        expiresAt: invitation.expiresAt,
      },
    };
  }

  static async getClassesForUser(userId: string, role: UserRole): Promise<any[]> {
    if (role === 'ADMIN') {
      const classes = await Class.find().sort({ createdAt: -1 }).populate('createdBy', 'name email');
      const classIds = classes.map((c) => c._id);

      const memberCounts = await ClassMember.aggregate([
        { $match: { classId: { $in: classIds } } },
        { $group: { _id: { classId: '$classId', role: '$role' }, count: { $sum: 1 } } },
      ]);

      const subjectCounts = await Subject.aggregate([
        { $match: { classId: { $in: classIds } } },
        { $group: { _id: '$classId', count: { $sum: 1 } } },
      ]);

      return classes.map((c) => {
        const faculties =
          memberCounts.find(
            (m) => m._id.classId.toString() === c._id.toString() && m._id.role === 'FACULTY'
          )?.count || 0;
        const students =
          memberCounts.find(
            (m) => m._id.classId.toString() === c._id.toString() && m._id.role === 'STUDENT'
          )?.count || 0;
        const subjects =
          subjectCounts.find((s) => s._id.toString() === c._id.toString())?.count || 0;

        return {
          ...c.toObject(),
          stats: { faculties, students, subjects },
        };
      });
    }

    // For Faculty / Student
    const memberships = await ClassMember.find({ userId });
    const classIds = memberships.map((m) => m.classId);

    const classes = await Class.find({ _id: { $in: classIds }, isArchived: false }).sort({
      createdAt: -1,
    });

    const subjectCounts = await Subject.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: '$classId', count: { $sum: 1 } } },
    ]);

    return classes.map((c) => {
      const subjects =
        subjectCounts.find((s) => s._id.toString() === c._id.toString())?.count || 0;
      return {
        ...c.toObject(),
        stats: { subjects },
      };
    });
  }

  static async getClassDetails(classId: string): Promise<any> {
    const cls = await Class.findById(classId).populate('createdBy', 'name email');
    if (!cls) throw new Error('Class not found.');

    const subjects = await Subject.find({ classId, isArchived: false }).populate(
      'primaryFacultyId coFaculties',
      'name email avatar'
    );

    const members = await ClassMember.find({ classId }).populate(
      'userId',
      'name email avatar department studentId points role'
    );

    const faculties = members
      .filter((m) => m.role === 'FACULTY')
      .map((m) => m.userId);

    const students = members
      .filter((m) => m.role === 'STUDENT')
      .map((m) => m.userId);

    return {
      class: cls,
      subjects,
      members,
      faculties,
      students,
      stats: {
        totalSubjects: subjects.length,
        totalFaculties: faculties.length,
        totalStudents: students.length,
      },
    };
  }

  static async removeMember(classId: string, userId: string): Promise<void> {
    await ClassMember.deleteOne({ classId, userId });
    // Also remove from subjects of that class
    await SubjectMember.deleteMany({ classId, userId });
  }
}
