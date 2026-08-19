import { Request, Response, NextFunction } from 'express';
import { MaterialService } from '../services/material.service.js';

export class MaterialController {
  static async uploadMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'Please attach a valid study material file.' });
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      const material = await MaterialService.createMaterial(req.user!.id, {
        classId: req.body.classId,
        subjectId: req.body.subjectId,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type || 'MATERIAL',
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        tags: req.body.tags,
      });

      res.status(201).json({
        success: true,
        message: 'Material uploaded successfully.',
        data: material,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMaterials(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId, type, search, tag, sortBy, page, limit } = req.query;
      if (!subjectId) {
        res.status(400).json({ success: false, message: 'Subject ID is required.' });
        return;
      }

      const result = await MaterialService.getMaterials(subjectId as string, {
        type: type as any,
        search: search as string,
        tag: tag as string,
        sortBy: sortBy as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async incrementView(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MaterialService.incrementView(req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  static async deleteMaterial(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await MaterialService.deleteMaterial(req.params.id, req.user!.id, req.user!.role);
      res.status(200).json({
        success: true,
        message: 'Material deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
