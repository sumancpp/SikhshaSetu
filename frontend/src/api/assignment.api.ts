import { apiClient } from './client';
import { Assignment, Submission } from '../types';

export const assignmentApi = {
  getAssignments: async (subjectId: string): Promise<{ success: boolean; data: Assignment[] }> => {
    const res = await apiClient.get('/assignments', { params: { subjectId } });
    return res.data;
  },
  createAssignment: async (data: any) => {
    const res = await apiClient.post('/assignments', data);
    return res.data;
  },
  submitAssignment: async (assignmentId: string, formData: FormData) => {
    const res = await apiClient.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getSubmissions: async (assignmentId: string): Promise<{ success: boolean; data: Submission[] }> => {
    const res = await apiClient.get(`/assignments/${assignmentId}/submissions`);
    return res.data;
  },
  gradeSubmission: async (submissionId: string, data: { marksObtained: number; feedback?: string }) => {
    const res = await apiClient.patch(`/assignments/submissions/${submissionId}/grade`, data);
    return res.data;
  },
};
