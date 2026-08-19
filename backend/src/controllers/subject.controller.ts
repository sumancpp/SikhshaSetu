import { Request, Response, NextFunction } from 'express';
import { SubjectService } from '../services/subject.service.js';
import { AuditService } from '../services/audit.service.js';

export class SubjectController {
  static async createSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await SubjectService.createSubject(req.user!.id, req.body);

      await AuditService.log({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'SUBJECT_CREATED',
        targetType: 'SUBJECT',
        targetId: subject._id.toString(),
        metadata: { name: subject.name, code: subject.code, classId: subject.classId },
      });

      res.status(201).json({
        success: true,
        message: 'Subject created successfully.',
        data: subject,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSubjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId } = req.query;
      const subjects = await SubjectService.getSubjectsForUser(
        req.user!.id,
        req.user!.role,
        classId as string
      );
      res.status(200).json({
        success: true,
        data: subjects,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSubjectWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspace = await SubjectService.getSubjectWorkspace(
        req.params.id,
        req.user?.id,
        req.user?.role
      );
      res.status(200).json({
        success: true,
        data: workspace,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateSubject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await SubjectService.updateSubject(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Subject updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async addCoFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const subject = await SubjectService.addCoFaculty(
        req.params.id,
        req.user!.id,
        req.body.facultyId,
        req.body.permissions
      );
      res.status(200).json({
        success: true,
        message: 'Co-Faculty added with permissions.',
        data: subject,
      });
    } catch (err) {
      next(err);
    }
  }

  static async enrollStudent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SubjectService.enrollStudent(req.params.id, req.body.studentId || req.body.email);
      res.status(200).json({
        success: true,
        message: 'Student enrolled successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderboard = await SubjectService.getSubjectLeaderboard(req.params.id);
      res.status(200).json({
        success: true,
        data: leaderboard,
      });
    } catch (err) {
      next(err);
    }
  }
}
