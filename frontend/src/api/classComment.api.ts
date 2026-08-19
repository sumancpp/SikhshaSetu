import { apiClient } from './client';
import { ApiResponse, ClassComment, CommentVisibility } from '../types';

export const classCommentApi = {
  getComments: async (
    classId: string,
    params?: { filter?: 'ALL' | 'PRIVATE' | 'MY'; limit?: number }
  ): Promise<ApiResponse<ClassComment[]>> => {
    const res = await apiClient.get<ApiResponse<ClassComment[]>>(`/classes/${classId}/comments`, {
      params,
    });
    return res.data;
  },

  createComment: async (
    classId: string,
    data: {
      content: string;
      visibility?: CommentVisibility;
      targetUserIds?: string[];
      attachments?: { fileName: string; fileUrl: string; fileSize: number }[];
    }
  ): Promise<ApiResponse<ClassComment>> => {
    const res = await apiClient.post<ApiResponse<ClassComment>>(`/classes/${classId}/comments`, data);
    return res.data;
  },

  deleteComment: async (commentId: string): Promise<ApiResponse<null>> => {
    const res = await apiClient.delete<ApiResponse<null>>(`/classes/comments/${commentId}`);
    return res.data;
  },
};
