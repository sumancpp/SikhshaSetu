import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from '../services/attendance.service.js';

export class AttendanceController {
  static async createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId } = req.params;
      const { title, subjectId, centerLatitude, centerLongitude, allowedRadiusMeters, durationMinutes } =
        req.body;

      if (centerLatitude === undefined || centerLongitude === undefined) {
        res.status(400).json({
          success: false,
          message: 'Classroom GPS Coordinates (Latitude and Longitude) are required.',
        });
        return;
      }

      const session = await AttendanceService.createSession(
        req.user!.id,
        req.user!.role,
        classId,
        {
          title,
          subjectId,
          centerLatitude: Number(centerLatitude),
          centerLongitude: Number(centerLongitude),
          allowedRadiusMeters: allowedRadiusMeters ? Number(allowedRadiusMeters) : 100,
          durationMinutes: durationMinutes ? Number(durationMinutes) : 5,
        }
      );

      res.status(201).json({
        success: true,
        message: '5-minute Dynamic Attendance session started successfully.',
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLiveToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const tokenData = await AttendanceService.getLiveSessionToken(sessionId, req.user!.id);

      res.status(200).json({
        success: true,
        data: tokenData,
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, token, latitude, longitude, accuracyMeters, deviceFingerprint } = req.body;

      if (!sessionId || !token || latitude === undefined || longitude === undefined) {
        res.status(400).json({
          success: false,
          message: 'Session ID, Dynamic QR Token, and Live GPS Coordinates are required.',
        });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '';

      const record = await AttendanceService.submitAttendance(req.user!.id, {
        sessionId,
        token,
        latitude: Number(latitude),
        longitude: Number(longitude),
        accuracyMeters: accuracyMeters ? Number(accuracyMeters) : 0,
        deviceFingerprint,
        ipAddress,
      });

      res.status(200).json({
        success: true,
        message: 'Attendance verified and recorded successfully! (+5 points)',
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSessionDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId } = req.params;
      const details = await AttendanceService.getSessionDetails(sessionId);

      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createSubjectSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.params;
      const { title, centerLatitude, centerLongitude, allowedRadiusMeters, durationMinutes } =
        req.body;

      if (centerLatitude === undefined || centerLongitude === undefined) {
        res.status(400).json({
          success: false,
          message: 'Classroom GPS Coordinates (Latitude and Longitude) are required.',
        });
        return;
      }

      const session = await AttendanceService.createSubjectSession(
        req.user!.id,
        req.user!.role,
        subjectId,
        {
          title,
          centerLatitude: Number(centerLatitude),
          centerLongitude: Number(centerLongitude),
          allowedRadiusMeters: allowedRadiusMeters ? Number(allowedRadiusMeters) : 100,
          durationMinutes: durationMinutes ? Number(durationMinutes) : 5,
        }
      );

      res.status(201).json({
        success: true,
        message: '5-minute Subject Dynamic Attendance session started successfully.',
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSubjectHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.params;
      const history = await AttendanceService.getSubjectAttendanceHistory(subjectId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getClassHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId } = req.params;
      const history = await AttendanceService.getClassAttendanceHistory(classId);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId, subjectId } = req.query;
      const history = await AttendanceService.getStudentAttendanceHistory(
        req.user!.id,
        classId as string,
        subjectId as string
      );

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      next(err);
    }
  }
}
