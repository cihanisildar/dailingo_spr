import { useCallback } from 'react';
import { useApi } from './useApi';

interface TestSession {
  id: string;
  createdAt: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageTime: number;
  results: {
    word: string;
    definition: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];
}

interface TestResult {
  wordId: string;
  isCorrect: boolean;
  timeSpent: number;
}

export const useTest = () => {
  const api = useApi();

  const startTest = useCallback(async (data: {
    cardIds: string[];
    mode: 'word' | 'definition';
  }) => {
    return api.post<{ sessionId: string }>('/test-session', data);
  }, [api]);

  const submitTestResults = useCallback(async (sessionId: string, results: TestResult[]) => {
    return api.post<TestSession>(`/test-session/${sessionId}/results`, { results });
  }, [api]);

  const getTestHistory = useCallback(async () => {
    return api.get<TestSession[]>('/test-history');
  }, [api]);

  const getTestSession = useCallback(async (sessionId: string) => {
    return api.get<TestSession>(`/test-session/${sessionId}`);
  }, [api]);

  return {
    startTest,
    submitTestResults,
    getTestHistory,
    getTestSession,
  };
}; 