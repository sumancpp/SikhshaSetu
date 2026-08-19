import { apiClient } from './client';
import { CodeExecutionOutput, TestCaseItem, TestCaseEvaluationReport } from '../types';

export const codeApi = {
  runCode: async (data: {
    language: string;
    code: string;
    stdin?: string;
  }): Promise<{ success: boolean; data: CodeExecutionOutput }> => {
    const res = await apiClient.post('/code/run', data);
    return res.data;
  },

  evalTestCases: async (data: {
    language: string;
    code: string;
    testCases: TestCaseItem[];
  }): Promise<{ success: boolean; data: TestCaseEvaluationReport }> => {
    const res = await apiClient.post('/code/eval-testcases', data);
    return res.data;
  },
};
