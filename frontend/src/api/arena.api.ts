import { apiClient } from './client';
import { ArenaMatchState, ArenaRoundResult } from '../types';

export const arenaApi = {
  startMatch: async (data?: {
    subjectId?: string;
  }): Promise<{ success: boolean; data: ArenaMatchState }> => {
    const res = await apiClient.post('/arena/start-match', data || {});
    return res.data;
  },

  submitRound: async (data: {
    matchId: string;
    questionId: string;
    selectedOptionIndex: number;
    timeTakenSeconds: number;
  }): Promise<{
    success: boolean;
    data: {
      matchState: ArenaMatchState;
      roundResult: ArenaRoundResult;
    };
  }> => {
    const res = await apiClient.post('/arena/submit-round', data);
    return res.data;
  },

  getMatchStatus: async (matchId: string): Promise<{ success: boolean; data: ArenaMatchState }> => {
    const res = await apiClient.get(`/arena/match-status/${matchId}`);
    return res.data;
  },
};
