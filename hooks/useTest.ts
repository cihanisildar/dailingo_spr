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
  cardId: string;
  isCorrect: boolean;
  timeSpent: number;
}

export const useTest = () => {
  const api = useApi();

  const startTest = useCallback(async (data: {
    cardIds: string[];
    mode: 'word' | 'definition';
  }) => {
    console.log('useTest startTest called with:', data);
    const response = await api.post<TestSession>('/test-sessions', data);
    console.log('useTest startTest response:', response);
    return { sessionId: response.id };
  }, [api]);

  const submitTestResults = useCallback(async (sessionId: string, result: TestResult) => {
    return api.post<TestSession>(`/test-sessions/${sessionId}/results`, result);
  }, [api]);

  const getTestHistory = useCallback(async () => {
    return api.get<TestSession[]>('/test-sessions');
  }, [api]);

  const getTestSession = useCallback(async (sessionId: string) => {
    return api.get<TestSession>(`/test-sessions/${sessionId}`);
  }, [api]);

  return {
    startTest,
    submitTestResults,
    getTestHistory,
    getTestSession,
  };
}; 