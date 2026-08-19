import { apiClient } from './client';
import { Quiz } from '../types';

export const quizApi = {
  getQuizzes: async (subjectId: string): Promise<{ success: boolean; data: Quiz[] }> => {
    const res = await apiClient.get('/quizzes', { params: { subjectId } });
    return res.data;
  },
  getQuizById: async (id: string): Promise<{ success: boolean; data: Quiz }> => {
    const res = await apiClient.get(`/quizzes/${id}`);
    return res.data;
  },
  createQuiz: async (data: any) => {
    const res = await apiClient.post('/quizzes', data);
    return res.data;
  },
  submitQuizAttempt: async (id: string, answers: any[]) => {
    const res = await apiClient.post(`/quizzes/${id}/attempt`, { answers });
    return res.data;
  },
  getQuizResults: async (id: string): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get(`/quizzes/${id}/results`);
    return res.data;
  },
};
