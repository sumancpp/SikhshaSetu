import { Request, Response, NextFunction } from 'express';
import { ClassCommentService } from '../services/classComment.service.js';

export class ClassCommentController {
  static async createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId } = req.params;
      const { content, visibility, targetUserIds, attachments } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({
          success: false,
          message: 'Comment content is required.',
        });
        return;
      }

      const comment = await ClassCommentService.createComment(
        req.user!.id,
        req.user!.role,
        classId,
        {
          content,
          visibility,
          targetUserIds,
          attachments,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Comment posted successfully.',
        data: comment,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId } = req.params;
      const { filter, limit } = req.query;

      const comments = await ClassCommentService.getComments(
        req.user!.id,
        req.user!.role,
        classId,
        {
          filter: filter as any,
          limit: limit ? Number(limit) : undefined,
        }
      );

      res.status(200).json({
        success: true,
        data: comments,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { commentId } = req.params;
      await ClassCommentService.deleteComment(commentId, req.user!.id, req.user!.role);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }
}
