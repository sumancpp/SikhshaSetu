import crypto from 'crypto';
import { Types } from 'mongoose';
import { AttendanceSession, IAttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceRecord, IAttendanceRecord } from '../models/AttendanceRecord.js';
import { Class } from '../models/Class.js';
import { Subject } from '../models/Subject.js';
import { ClassMember } from '../models/ClassMember.js';
import { PointsService } from './points.service.js';
import { emitToClass, emitToUser } from '../config/socket.js';
import { UserRole } from '../models/User.js';

export class AttendanceService {
  /**
   * Helper: Calculate distance between two GPS coordinates using Haversine formula (in meters)
   */
  static getHaversineDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Radius of Earth in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Helper: Generate a time-bucketed cryptographic HMAC token that rotates every 10 seconds
   */
  static generateDynamicToken(
    sessionId: string,
    sessionSecret: string,
    windowOffset: number = 0
  ): string {
    const bucket = Math.floor(Date.now() / 10000) + windowOffset;
    return crypto
      .createHmac('sha256', sessionSecret)
      .update(`${sessionId}:${bucket}`)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Faculty initializes a 5-minute dynamic QR attendance session for an individual Subject
   */
  static async createSubjectSession(
    facultyId: string,
    userRole: UserRole,
    subjectId: string,
    data: {
      title?: string;
      centerLatitude: number;
      centerLongitude: number;
      allowedRadiusMeters?: number;
      durationMinutes?: number;
    }
  ): Promise<IAttendanceSession> {
    if (userRole !== 'FACULTY' && userRole !== 'ADMIN') {
      throw new Error('Only faculty and administrators can create attendance sessions.');
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) throw new Error('Subject not found');

    const classDoc = await Class.findById(subject.classId);
    if (!classDoc) throw new Error('Associated Class not found');

    const sessionSecret = crypto.randomBytes(32).toString('hex');
    const durationMinutes = Math.min(60, Math.max(1, data.durationMinutes || 5));
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const session = await AttendanceSession.create({
      classId: subject.classId,
      subjectId: new Types.ObjectId(subjectId),
      facultyId: new Types.ObjectId(facultyId),
      title: data.title || `${subject.name} (${subject.code}) - Live Attendance`,
      sessionSecret,
      centerLatitude: data.centerLatitude,
      centerLongitude: data.centerLongitude,
      allowedRadiusMeters: data.allowedRadiusMeters || 100,
      startTime,
      endTime,
      status: 'ACTIVE',
      attendanceCount: 0,
    });

    emitToClass(subject.classId.toString(), 'attendance:session-started', {
      sessionId: session._id,
      subjectId: subject._id,
      title: session.title,
      endTime: session.endTime,
      allowedRadiusMeters: session.allowedRadiusMeters,
    });

    return session;
  }

  /**
   * Faculty initializes a 5-minute dynamic QR attendance session with classroom GPS coordinates
   */
  static async createSession(
    facultyId: string,
    userRole: UserRole,
    classId: string,
    data: {
      title?: string;
      subjectId?: string;
      centerLatitude: number;
      centerLongitude: number;
      allowedRadiusMeters?: number;
      durationMinutes?: number;
    }
  ): Promise<IAttendanceSession> {
    if (userRole !== 'FACULTY' && userRole !== 'ADMIN') {
      throw new Error('Only faculty and administrators can create attendance sessions.');
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) throw new Error('Class not found');

    const sessionSecret = crypto.randomBytes(32).toString('hex');
    const durationMinutes = Math.min(60, Math.max(1, data.durationMinutes || 5));
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const session = await AttendanceSession.create({
      classId: new Types.ObjectId(classId),
      subjectId: data.subjectId ? new Types.ObjectId(data.subjectId) : undefined,
      facultyId: new Types.ObjectId(facultyId),
      title: data.title || `${classDoc.name} - Live Attendance`,
      sessionSecret,
      centerLatitude: data.centerLatitude,
      centerLongitude: data.centerLongitude,
      allowedRadiusMeters: data.allowedRadiusMeters || 100,
      startTime,
      endTime,
      status: 'ACTIVE',
      attendanceCount: 0,
    });

    emitToClass(classId, 'attendance:session-started', {
      sessionId: session._id,
      subjectId: session.subjectId,
      title: session.title,
      endTime: session.endTime,
      allowedRadiusMeters: session.allowedRadiusMeters,
    });

    return session;
  }

  /**
   * Get the current rotating token for faculty display (refreshes every 10s)
   */
  static async getLiveSessionToken(
    sessionId: string,
    facultyId: string
  ): Promise<{
    token: string;
    sessionId: string;
    timeRemainingSeconds: number;
    rotationIntervalMs: number;
    active: boolean;
  }> {
    const session = await AttendanceSession.findById(sessionId);
    if (!session) throw new Error('Attendance session not found');

    const now = Date.now();
    const isExpired = now >= new Date(session.endTime).getTime();

    if (isExpired && session.status === 'ACTIVE') {
      session.status = 'EXPIRED';
      await session.save();
    }

    if (session.status !== 'ACTIVE') {
      return {
        token: '',
        sessionId,
        timeRemainingSeconds: 0,
        rotationIntervalMs: 10000,
        active: false,
      };
    }

    const timeRemainingSeconds = Math.max(0, Math.round((new Date(session.endTime).getTime() - now) / 1000));
    const token = this.generateDynamicToken(sessionId, session.sessionSecret, 0);

    return {
      token,
      sessionId,
      timeRemainingSeconds,
      rotationIntervalMs: 10000,
      active: true,
    };
  }

  /**
   * Student submits dynamic QR token along with active mobile GPS location
   */
  static async submitAttendance(
    studentId: string,
    data: {
      sessionId: string;
      token: string;
      latitude: number;
      longitude: number;
      accuracyMeters?: number;
      deviceFingerprint?: string;
      ipAddress?: string;
    }
  ): Promise<IAttendanceRecord> {
    const session = await AttendanceSession.findById(data.sessionId);
    if (!session) throw new Error('Attendance session not found.');

    const now = Date.now();
    if (session.status !== 'ACTIVE' || now > new Date(session.endTime).getTime()) {
      if (session.status === 'ACTIVE') {
        session.status = 'EXPIRED';
        await session.save();
      }
      throw new Error('This attendance session has already expired.');
    }

    // 1. Anti-Cheat Rotating Token Validation (supports current window and 1 window clock skew)
    const validTokenNow = this.generateDynamicToken(data.sessionId, session.sessionSecret, 0);
    const validTokenPrev = this.generateDynamicToken(data.sessionId, session.sessionSecret, -1);

    const isTokenValid = data.token === validTokenNow || data.token === validTokenPrev;
    if (!isTokenValid) {
      throw new Error(
        'QR Code has expired! Dynamic tokens rotate every 10 seconds. Live on-screen scan is required.'
      );
    }

    // 2. Check if student already submitted for this session
    const existing = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: new Types.ObjectId(studentId),
    });
    if (existing) {
      throw new Error('Attendance already recorded for this session.');
    }

    // 3. Geolocation Distance Verification (Haversine Formula)
    const distanceMeters = this.getHaversineDistanceMeters(
      session.centerLatitude,
      session.centerLongitude,
      data.latitude,
      data.longitude
    );

    const isWithinRadius = distanceMeters <= session.allowedRadiusMeters;
    const verificationStatus = isWithinRadius ? 'PRESENT' : 'OUT_OF_RANGE';
    const pointsToAward = isWithinRadius ? 5 : 0;

    const record = await AttendanceRecord.create({
      sessionId: session._id,
      classId: session.classId,
      subjectId: session.subjectId,
      studentId: new Types.ObjectId(studentId),
      scannedAt: new Date(),
      latitude: data.latitude,
      longitude: data.longitude,
      accuracyMeters: data.accuracyMeters || 0,
      distanceFromCenter: distanceMeters,
      verificationStatus,
      deviceFingerprint: data.deviceFingerprint || '',
      ipAddress: data.ipAddress || '',
      pointsAwarded: pointsToAward,
    });

    // Increment attendance count if present
    if (isWithinRadius) {
      session.attendanceCount = (session.attendanceCount || 0) + 1;
      await session.save();

      // Award attendance bonus points
      await PointsService.awardPoints(
        studentId,
        'CHALLENGE',
        5,
        `Verified In-Class Attendance: "${session.title}"`,
        record._id
      );
    }

    const populatedRecord = await AttendanceRecord.findById(record._id).populate(
      'studentId',
      'name email studentId avatar department'
    );

    // Notify Faculty & Classroom live dashboard
    emitToUser(session.facultyId.toString(), 'attendance:record-created', populatedRecord);
    emitToClass(session.classId.toString(), 'attendance:count-updated', {
      sessionId: session._id,
      count: session.attendanceCount,
    });

    if (!isWithinRadius) {
      throw new Error(
        `Location Verification Failed! You are ${Math.round(distanceMeters)}m away from the classroom (allowed radius: ${session.allowedRadiusMeters}m).`
      );
    }

    return (populatedRecord || record) as IAttendanceRecord;
  }

  /**
   * Live Session Details and Attendee List for Faculty / Admin
   */
  static async getSessionDetails(sessionId: string): Promise<any> {
    const session = await AttendanceSession.findById(sessionId)
      .populate('facultyId', 'name email avatar')
      .populate('classId', 'name code department')
      .populate('subjectId', 'name code');

    if (!session) throw new Error('Attendance session not found');

    const records = await AttendanceRecord.find({ sessionId })
      .populate('studentId', 'name email studentId avatar department')
      .sort({ scannedAt: -1 });

    const totalStudentsInClass = await ClassMember.countDocuments({
      classId: session.classId,
      role: 'STUDENT',
    });

    return {
      session,
      records,
      totalEnrolledStudents: totalStudentsInClass,
      verifiedPresentCount: records.filter((r) => r.verificationStatus === 'PRESENT').length,
      outOfRangeCount: records.filter((r) => r.verificationStatus === 'OUT_OF_RANGE').length,
    };
  }

  /**
   * Get subject attendance history and session reports for faculty & admin
   */
  static async getSubjectAttendanceHistory(subjectId: string): Promise<any[]> {
    const sessions = await AttendanceSession.find({ subjectId: new Types.ObjectId(subjectId) })
      .populate('facultyId', 'name email avatar')
      .populate('subjectId', 'name code')
      .sort({ startTime: -1 })
      .limit(50);

    return sessions;
  }

  /**
   * Get class attendance history and session reports for faculty & admin
   */
  static async getClassAttendanceHistory(classId: string): Promise<any[]> {
    const sessions = await AttendanceSession.find({ classId })
      .populate('facultyId', 'name email')
      .populate('subjectId', 'name code')
      .sort({ startTime: -1 })
      .limit(50);

    return sessions;
  }

  /**
   * Get student's personal attendance history
   */
  static async getStudentAttendanceHistory(
    studentId: string,
    classId?: string,
    subjectId?: string
  ): Promise<{ records: any[]; totalPresent: number; attendancePercentage: number }> {
    const query: any = { studentId: new Types.ObjectId(studentId) };
    if (subjectId) query.subjectId = new Types.ObjectId(subjectId);
    else if (classId) query.classId = new Types.ObjectId(classId);

    const records = await AttendanceRecord.find(query)
      .populate('sessionId', 'title startTime endTime')
      .populate('classId', 'name code')
      .populate('subjectId', 'name code')
      .sort({ scannedAt: -1 });

    const totalPresent = records.filter((r) => r.verificationStatus === 'PRESENT').length;

    let totalSessions = records.length;
    if (subjectId) {
      totalSessions = await AttendanceSession.countDocuments({ subjectId });
    } else if (classId) {
      totalSessions = await AttendanceSession.countDocuments({ classId });
    }

    const attendancePercentage =
      totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 100;

    return {
      records,
      totalPresent,
      attendancePercentage,
    };
  }
}
