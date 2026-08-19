import { apiClient } from './client';
import { User } from '../types';

export const authApi = {
  register: async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  login: async (data: any) => {
    const res = await apiClient.post('/auth/login', data);
    return res.data;
  },
  googleAuth: async (data: any) => {
    const res = await apiClient.post('/auth/google', data);
    return res.data;
  },
  logout: async () => {
    const res = await apiClient.post('/auth/logout');
    return res.data;
  },
  getMe: async (): Promise<{ success: boolean; data: User }> => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.patch('/auth/me', data);
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (data: any) => {
    const res = await apiClient.post('/auth/reset-password', data);
    return res.data;
  },
};
