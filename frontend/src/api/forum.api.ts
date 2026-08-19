import { apiClient } from './client';
import { ForumPost, ForumAnswer } from '../types';

export const forumApi = {
  getPosts: async (params: {
    classId?: string;
    subjectId?: string;
    search?: string;
    tag?: string;
    filter?: string;
    sortBy?: string;
    page?: number;
    audience?: string;
    department?: string;
  }): Promise<{ success: boolean; data: { posts: ForumPost[]; total: number; page: number; pages: number } }> => {
    const res = await apiClient.get('/forum/posts', { params });
    return res.data;
  },
  getPostById: async (id: string): Promise<{ success: boolean; data: { post: ForumPost; answers: ForumAnswer[] } }> => {
    const res = await apiClient.get(`/forum/posts/${id}`);
    return res.data;
  },
  createPost: async (data: any) => {
    const res = await apiClient.post('/forum/posts', data);
    return res.data;
  },
  createAnswer: async (postId: string, content: string) => {
    const res = await apiClient.post(`/forum/posts/${postId}/answers`, { content });
    return res.data;
  },
  markAcceptedAnswer: async (postId: string, answerId: string) => {
    const res = await apiClient.post(`/forum/posts/${postId}/answers/${answerId}/accept`);
    return res.data;
  },
  handleVote: async (id: string, targetType: 'POST' | 'ANSWER', voteValue: number) => {
    const res = await apiClient.post(`/forum/vote/${id}`, { targetType, voteValue });
    return res.data;
  },
  getTrendingTags: async (classId?: string) => {
    const res = await apiClient.get('/forum/tags', { params: { classId } });
    return res.data;
  },
};
