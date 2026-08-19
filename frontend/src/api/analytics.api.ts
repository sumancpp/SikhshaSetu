import { apiClient } from './client';
import { SubjectAtRiskSummary, StudentAcademicHealth } from '../types';

export const analyticsApi = {
  getSubjectAtRiskAnalytics: async (
    subjectId: string
  ): Promise<{ success: boolean; data: SubjectAtRiskSummary }> => {
    const res = await apiClient.get(`/analytics/subject/${subjectId}/at-risk`);
    return res.data;
  },

  sendIntervention: async (
    subjectId: string,
    data: {
      studentId: string;
      message: string;
      actionPlan?: string;
      sendEmailNotification?: boolean;
    }
  ): Promise<{ success: boolean; data: { success: boolean; message: string } }> => {
    const res = await apiClient.post(`/analytics/subject/${subjectId}/intervene`, data);
    return res.data;
  },

  getStudentHealth: async (): Promise<{ success: boolean; data: StudentAcademicHealth }> => {
    const res = await apiClient.get('/analytics/student/my-health');
    return res.data;
  },

  getAdminAnalytics: async (): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get('/analytics/admin');
    return res.data;
  },

  getFacultyAnalytics: async (): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get('/analytics/faculty');
    return res.data;
  },

  getStudentAnalytics: async (): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get('/analytics/student');
    return res.data;
  },

  getAuditLogs: async (): Promise<{ success: boolean; data: any }> => {
    const res = await apiClient.get('/analytics/audit-logs');
    return res.data;
  },
};
