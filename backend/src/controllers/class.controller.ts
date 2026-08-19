import { Request, Response, NextFunction } from 'express';
import { ClassService } from '../services/class.service.js';
import { AuditService } from '../services/audit.service.js';

export class ClassController {
  static async createClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cls = await ClassService.createClass(req.user!.id, req.body);

      await AuditService.log({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: 'CLASS_CREATED',
        targetType: 'CLASS',
        targetId: cls._id.toString(),
        metadata: { name: cls.name, code: cls.code },
      });

      res.status(201).json({
        success: true,
        message: 'Class created successfully.',
        data: cls,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getClasses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classes = await ClassService.getClassesForUser(req.user!.id, req.user!.role);
      res.status(200).json({
        success: true,
        data: classes,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getClassById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const classDetails = await ClassService.getClassDetails(req.params.id);
      res.status(200).json({
        success: true,
        data: classDetails,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ClassService.updateClass(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Class updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  static async regenerateCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newCode = await ClassService.regenerateCode(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Class join code regenerated.',
        data: { code: newCode },
      });
    } catch (err) {
      next(err);
    }
  }

  static async joinClass(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClassService.joinClassByCode(req.user!.id, req.body.code, req.user!.role);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.class,
      });
    } catch (err) {
      next(err);
    }
  }

  static async inviteFaculty(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ClassService.inviteFaculty(req.params.id, req.user!.id, req.body.email);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.invitation,
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ClassService.removeMember(req.params.id, req.params.userId);
      res.status(200).json({
        success: true,
        message: 'Member removed from class.',
      });
    } catch (err) {
      next(err);
    }
  }
}
