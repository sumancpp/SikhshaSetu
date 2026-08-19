import { Request, Response, NextFunction } from 'express';
import { Report } from '../models/Report.js';
import { AuditService } from '../services/audit.service.js';

export class ReportController {
  static async createReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await Report.create({
        ...req.body,
        reporterId: req.user!.id,
      });

      res.status(201).json({
        success: true,
        message: 'Report submitted for review.',
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.query;
      const filter: any = {};
      if (status) filter.status = status;

      const reports = await Report.find(filter)
        .sort({ createdAt: -1 })
        .populate('reporterId', 'name email role')
        .populate('resolvedBy', 'name email');

      res.status(200).json({
        success: true,
        data: reports,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateReportStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const report = await Report.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status: req.body.status,
            resolutionNote: req.body.resolutionNote || '',
            resolvedBy: req.user!.id,
          },
        },
        { new: true }
      );

      await AuditService.log({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'REPORT_MODERATED',
        targetType: 'REPORT',
        targetId: req.params.id,
        metadata: { status: req.body.status },
      });

      res.status(200).json({
        success: true,
        message: `Report marked as ${req.body.status}.`,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
}
