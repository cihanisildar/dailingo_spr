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
    // Return the session with sessionId field for compatibility
    return { sessionId: response.id, ...response };
  }, [api]);

  const submitTestResults = useCallback(async (sessionId: string, result: TestResult) => {
    console.log('API payload being sent:', result);
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