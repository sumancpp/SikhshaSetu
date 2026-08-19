import { apiClient } from './client';
import { Material } from '../types';

export const materialApi = {
  getMaterials: async (params: {
    subjectId: string;
    type?: string;
    search?: string;
    tag?: string;
    sortBy?: string;
    page?: number;
  }): Promise<{ success: boolean; data: { materials: Material[]; total: number; page: number; pages: number } }> => {
    const res = await apiClient.get('/materials', { params });
    return res.data;
  },
  uploadMaterial: async (formData: FormData) => {
    const res = await apiClient.post('/materials', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  incrementView: async (id: string) => {
    const res = await apiClient.patch(`/materials/${id}/view`);
    return res.data;
  },
  deleteMaterial: async (id: string) => {
    const res = await apiClient.delete(`/materials/${id}`);
    return res.data;
  },
};
