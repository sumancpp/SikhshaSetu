import { apiClient } from './client';

export const reportApi = {
  createReport: async (data: any) => {
    const res = await apiClient.post('/reports', data);
    return res.data;
  },
  getReports: async (status?: string) => {
    const res = await apiClient.get('/reports', { params: { status } });
    return res.data;
  },
  updateReportStatus: async (id: string, data: { status: string; resolutionNote?: string }) => {
    const res = await apiClient.patch(`/reports/${id}/status`, data);
    return res.data;
  },
};

export const userApi = {
  getUsers: async (params?: { role?: string; search?: string; page?: number }) => {
    const res = await apiClient.get('/users', { params });
    return res.data;
  },
  toggleSuspend: async (id: string) => {
    const res = await apiClient.patch(`/users/${id}/suspend`);
    return res.data;
  },
};
