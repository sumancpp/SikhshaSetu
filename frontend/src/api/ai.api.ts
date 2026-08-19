import { apiClient } from './client';
import {
  DoubtResponse,
  GeneratedQuizResult,
  AiRubricEvaluation,
  GeneratedFlashcard,
} from '../types';

export const aiApi = {
  askDoubt: async (data: {
    subjectId: string;
    question: string;
    history?: { role: 'user' | 'assistant'; content: string }[];
  }): Promise<{ success: boolean; data: DoubtResponse }> => {
    const res = await apiClient.post('/ai/ask-doubt', data);
    return res.data;
  },

  generateQuiz: async (data: {
    subjectId: string;
    materialId?: string;
    topic?: string;
    count?: number;
    difficulty?: 'Easy' | 'Medium' | 'Hard';
  }): Promise<{ success: boolean; data: GeneratedQuizResult }> => {
    const res = await apiClient.post('/ai/generate-quiz', data);
    return res.data;
  },

  gradeSubmission: async (data: {
    assignmentId: string;
    submissionId: string;
  }): Promise<{ success: boolean; data: AiRubricEvaluation }> => {
    const res = await apiClient.post('/ai/grade-submission', data);
    return res.data;
  },

  getFlashcards: async (
    subjectId: string,
    params?: { topic?: string; refresh?: boolean; seed?: number }
  ): Promise<{ success: boolean; data: GeneratedFlashcard[] }> => {
    const query = new URLSearchParams();
    if (params?.topic) query.append('topic', params.topic);
    if (params?.refresh) query.append('refresh', 'true');
    if (params?.seed !== undefined) query.append('seed', String(params.seed));

    const qs = query.toString();
    const res = await apiClient.get(`/ai/flashcards/${subjectId}${qs ? `?${qs}` : ''}`);
    return res.data;
  },

  checkPlagiarism: async (assignmentId: string): Promise<{ success: boolean; message: string; data: any }> => {
    const res = await apiClient.post('/ai/plagiarism-check', { assignmentId });
    return res.data;
  },

  getPlagiarismReport: async (assignmentId: string): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get(`/ai/plagiarism-report/${assignmentId}`);
    return res.data;
  },
};
