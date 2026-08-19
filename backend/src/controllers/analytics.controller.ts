import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  static async getSubjectAtRiskAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.params;
      if (!subjectId) {
        res.status(400).json({ success: false, message: 'Subject ID is required.' });
        return;
      }

      const summary = await AnalyticsService.getSubjectAtRiskAnalytics(subjectId);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  static async sendIntervention(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId } = req.params;
      const { studentId, message, actionPlan, sendEmailNotification } = req.body;
      const facultyId = req.user?.id || (req as any).user?._id;

      if (!subjectId || !studentId || !message) {
        res.status(400).json({
          success: false,
          message: 'Subject ID, Student ID, and Message are required.',
        });
        return;
      }

      const result = await AnalyticsService.sendInterventionAlert(subjectId, facultyId, studentId, {
        message,
        actionPlan,
        sendEmailNotification: Boolean(sendEmailNotification),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id || (req as any).user?._id;
      const health = await AnalyticsService.getStudentAcademicHealth(studentId);
      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getAdminOverview(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getAdminOverview();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getFacultyOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const facultyId = req.user?.id || (req as any).user?._id;
      const data = await AnalyticsService.getFacultyOverview(facultyId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getStudentOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const studentId = req.user?.id || (req as any).user?._id;
      const data = await AnalyticsService.getStudentOverview(studentId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AnalyticsService.getAuditLogs();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}
