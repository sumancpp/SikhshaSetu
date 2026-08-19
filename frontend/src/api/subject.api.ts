import { apiClient } from './client';
import { Subject, LeaderboardEntry } from '../types';

export const subjectApi = {
  getSubjects: async (classId?: string): Promise<{ success: boolean; data: Subject[] }> => {
    const res = await apiClient.get('/subjects', { params: { classId } });
    return res.data;
  },
  getSubjectWorkspace: async (id: string) => {
    const res = await apiClient.get(`/subjects/${id}`);
    return res.data;
  },
  createSubject: async (data: any) => {
    const res = await apiClient.post('/subjects', data);
    return res.data;
  },
  updateSubject: async (id: string, data: any) => {
    const res = await apiClient.patch(`/subjects/${id}`, data);
    return res.data;
  },
  addCoFaculty: async (id: string, data: { facultyId: string; permissions?: any }) => {
    const res = await apiClient.post(`/subjects/${id}/co-faculty`, data);
    return res.data;
  },
  enrollStudent: async (id: string, data: { studentId?: string; email?: string }) => {
    const res = await apiClient.post(`/subjects/${id}/enroll`, data);
    return res.data;
  },
  getSubjectLeaderboard: async (id: string): Promise<{ success: boolean; data: LeaderboardEntry[] }> => {
    const res = await apiClient.get(`/subjects/${id}/leaderboard`);
    return res.data;
  },
};
