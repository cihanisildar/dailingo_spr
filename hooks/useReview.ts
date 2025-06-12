import { useCallback } from 'react';
import { useApi } from './useApi';
import { useQuery } from '@tanstack/react-query';

interface ReviewSession {
  id: string;
  createdAt: string;
  completedAt?: string;
  cards: {
    id: string;
    word: string;
    definition: string;
    status: 'pending' | 'correct' | 'incorrect';
  }[];
}

interface ReviewResult {
  cardId: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface ReviewSchedule {
  id: string;
  name: string;
  description: string | null;
  intervals: number[];
  isDefault: boolean;
}

export function useReviewScheduleQuery() {
  const api = useApi();
  return useQuery<ReviewSchedule>({
    queryKey: ['review-schedule'],
    queryFn: async () => {
      const response = await api.get<ReviewSchedule>('/review-schedule');
      console.log('API Response:', response);
      
      if (response && 'id' in response) {
        return response;
      }
      
      if (response && typeof response === 'object' && 'data' in response) {
        return (response as { data: ReviewSchedule }).data;
      }
      
      throw new Error('Invalid review schedule response format');
    },
  });
}

export const useReview = () => {
  const api = useApi();

  const startReview = useCallback(async (data: {
    cardIds: string[];
  }) => {
    return api.post<{ sessionId: string }>('/review-session', data);
  }, [api]);

  const submitReviewResults = useCallback(async (sessionId: string, results: ReviewResult[]) => {
    return api.post<ReviewSession>(`/review-session/${sessionId}/results`, { results });
  }, [api]);

  const getReviewHistory = useCallback(async () => {
    return api.get<ReviewSession[]>('/review-session/history');
  }, [api]);

  const getReviewSession = useCallback(async (sessionId: string) => {
    return api.get<ReviewSession>(`/review-session/${sessionId}`);
  }, [api]);

  const getReviewSchedule = useCallback(async () => {
    return api.get<{
      today: number;
      upcoming: number;
      schedule: {
        date: string;
        count: number;
      }[];
    }>('/review-schedule');
  }, [api]);

  return {
    startReview,
    submitReviewResults,
    getReviewHistory,
    getReviewSession,
    getReviewSchedule,
  };
}; 