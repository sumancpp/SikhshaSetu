import { Request, Response, NextFunction } from 'express';
import { ForumService } from '../services/forum.service.js';

export class ForumController {
  static async createPost(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const post = await ForumService.createPost(req.user!.id, req.user!.role, req.body);
      res.status(201).json({
        success: true,
        message: 'Question posted successfully (+5 pts).',
        data: post,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPosts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { classId, subjectId, search, tag, filter, sortBy, page, limit, audience, department } = req.query;
      const result = await ForumService.getPosts({
        classId: classId as string,
        subjectId: subjectId as string,
        search: search as string,
        tag: tag as string,
        filter: filter as any,
        sortBy: sortBy as any,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        audience: audience as any,
        department: department as string,
        userRole: req.user?.role,
        userDepartment: req.user?.department,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPostById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentUserId = req.user?.id;
      const detail = await ForumService.getPostDetail(req.params.id, currentUserId, req.user?.role);
      res.status(200).json({
        success: true,
        data: detail,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const answer = await ForumService.createAnswer(
        req.user!.id,
        req.user!.role,
        req.params.id,
        req.body.content
      );

      res.status(201).json({
        success: true,
        message: 'Answer posted successfully (+10 pts).',
        data: answer,
      });
    } catch (err) {
      next(err);
    }
  }

  static async markAcceptedAnswer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await ForumService.markAcceptedAnswer(
        req.params.id,
        req.params.answerId,
        req.user!.id,
        req.user!.role
      );

      res.status(200).json({
        success: true,
        message: 'Answer marked as accepted solution! (+40 pts awarded)',
      });
    } catch (err) {
      next(err);
    }
  }

  static async handleVote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { targetType, voteValue } = req.body;
      const targetId = req.params.id;

      const result = await ForumService.handleVote(
        req.user!.id,
        targetType,
        targetId,
        voteValue
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTrendingTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tags = await ForumService.getTrendingTags(req.query.classId as string);
      res.status(200).json({
        success: true,
        data: tags,
      });
    } catch (err) {
      next(err);
    }
  }
}
