import { Notification, INotification } from '../models/Notification.js';

export class NotificationService {
  static async getNotificationsForUser(
    userId: string,
    limit: number = 30
  ): Promise<{ notifications: INotification[]; unreadCount: number }> {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('senderId', 'name avatar role'),
      Notification.countDocuments({ recipientId: userId, isRead: false }),
    ]);

    return { notifications, unreadCount };
  }

  static async markAsRead(notificationId: string, userId: string): Promise<void> {
    await Notification.findOneAndUpdate(
      { _id: notificationId, recipientId: userId },
      { $set: { isRead: true } }
    );
  }

  static async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ recipientId: userId, isRead: false }, { $set: { isRead: true } });
  }
}
