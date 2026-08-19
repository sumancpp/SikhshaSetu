import { apiClient } from './client';
import { Challenge } from '../types';

export const challengeApi = {
  getChallenges: async (params?: { category?: string; classId?: string; subjectId?: string }): Promise<{ success: boolean; data: Challenge[] }> => {
    const res = await apiClient.get('/challenges', { params });
    return res.data;
  },
  getChallengeById: async (id: string): Promise<{ success: boolean; data: Challenge }> => {
    const res = await apiClient.get(`/challenges/${id}`);
    return res.data;
  },
  createChallenge: async (data: any) => {
    const res = await apiClient.post('/challenges', data);
    return res.data;
  },
  submitChallenge: async (id: string, answers: number[]) => {
    const res = await apiClient.post(`/challenges/${id}/submit`, { answers });
    return res.data;
  },
  getChallengeLeaderboard: async (id: string) => {
    const res = await apiClient.get(`/challenges/${id}/leaderboard`);
    return res.data;
  },
};
