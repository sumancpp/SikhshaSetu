import { apiClient } from './client';

export const searchApi = {
  globalSearch: async (q: string) => {
    const res = await apiClient.get('/search', { params: { q } });
    return res.data;
  },
};
