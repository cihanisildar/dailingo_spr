import { useQuery, useMutation } from '@tanstack/react-query';
import { useApi } from './useApi';

// Query keys
export const streakKeys = {
  all: ['streak'] as const,
};

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string;
}

export function useStreak(options = {}) {
  const api = useApi();
  return useQuery<StreakData>({
    queryKey: streakKeys.all,
    queryFn: async () => {
      const response = await api.get<StreakData>('/streak');
      return response;
    },
    ...options,
  });
}

export function useUpdateStreak() {
  const api = useApi();
  return useMutation<StreakData, Error, void>({
    mutationFn: async () => {
      return api.post<StreakData>('/streak', {});
    }
  });
} 