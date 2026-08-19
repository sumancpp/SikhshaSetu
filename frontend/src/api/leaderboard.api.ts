import { apiClient } from './client';
import { LeaderboardEntry } from '../types';

export const leaderboardApi = {
  getGlobalLeaderboard: async (): Promise<{ success: boolean; data: LeaderboardEntry[] }> => {
    const res = await apiClient.get('/leaderboard/global');
    return res.data;
  },
  getClassLeaderboard: async (classId: string): Promise<{ success: boolean; data: LeaderboardEntry[] }> => {
    const res = await apiClient.get(`/leaderboard/class/${classId}`);
    return res.data;
  },
};
