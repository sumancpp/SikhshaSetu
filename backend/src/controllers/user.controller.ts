import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AuditService } from '../services/audit.service.js';

export class UserController {
  static async getUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role, search, page = 1, limit = 25 } = req.query;
      const filter: any = {};

      if (role) filter.role = role;
      if (search) {
        const regex = new RegExp(search as string, 'i');
        filter.$or = [{ name: regex }, { email: regex }, { department: regex }, { studentId: regex }];
      }

      const p = Math.max(1, Number(page));
      const l = Math.min(100, Number(limit));
      const skip = (p - 1) * l;

      const [users, total] = await Promise.all([
        User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(l),
        User.countDocuments(filter),
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          total,
          page: p,
          pages: Math.ceil(total / l) || 1,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async toggleSuspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      if (user.role === 'ADMIN') {
        res.status(400).json({ success: false, message: 'Cannot suspend admin accounts.' });
        return;
      }

      user.isSuspended = !user.isSuspended;
      await user.save();

      await AuditService.log({
        actorId: req.user!.id,
        actorRole: req.user!.role,
        action: user.isSuspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
        targetType: 'USER',
        targetId: user._id.toString(),
        metadata: { email: user.email },
      });

      res.status(200).json({
        success: true,
        message: `User has been ${user.isSuspended ? 'suspended' : 'reinstated'}.`,
        data: user,
      });
    } catch (err) {
      next(err);
    }
  }
}
