import { AuditLog } from '../models/AuditLog.js';
import { UserRole } from '../models/User.js';

export class AuditService {
  static async log(data: {
    actorId: string;
    actorRole: UserRole;
    action: string;
    targetType: string;
    targetId?: string;
    metadata?: Record<string, any>;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await AuditLog.create({
        ...data,
      });
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  }

  static async getLogs(page: number = 1, limit: number = 20): Promise<any> {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'name email role'),
      AuditLog.countDocuments(),
    ]);

    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
    };
  }
}
