import { apiClient } from './client';
import { Class } from '../types';

export const classApi = {
  getClasses: async (): Promise<{ success: boolean; data: Class[] }> => {
    const res = await apiClient.get('/classes');
    return res.data;
  },
  getClassById: async (id: string) => {
    const res = await apiClient.get(`/classes/${id}`);
    return res.data;
  },
  createClass: async (data: any) => {
    const res = await apiClient.post('/classes', data);
    return res.data;
  },
  updateClass: async (id: string, data: any) => {
    const res = await apiClient.patch(`/classes/${id}`, data);
    return res.data;
  },
  joinClass: async (code: string) => {
    const res = await apiClient.post('/classes/join', { code });
    return res.data;
  },
  regenerateCode: async (id: string) => {
    const res = await apiClient.post(`/classes/${id}/regenerate-code`);
    return res.data;
  },
  inviteFaculty: async (id: string, email: string) => {
    const res = await apiClient.post(`/classes/${id}/invite-faculty`, { email });
    return res.data;
  },
  removeMember: async (classId: string, userId: string) => {
    const res = await apiClient.delete(`/classes/${classId}/members/${userId}`);
    return res.data;
  },
};
