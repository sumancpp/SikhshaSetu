import { apiClient } from './client';
import { NotificationItem } from '../types';

export const notificationApi = {
  getNotifications: async (): Promise<{ success: boolean; data: { notifications: NotificationItem[]; unreadCount: number } }> => {
    const res = await apiClient.get('/notifications');
    return res.data;
  },
  markAsRead: async (id: string) => {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },
};
