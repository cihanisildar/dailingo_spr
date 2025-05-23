import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

// Query keys
export const streakKeys = {
  all: ['streak'] as const,
};

export function useStreak() {
  return useQuery({
    queryKey: streakKeys.all,
    queryFn: async () => {
      const { data } = await api.get('/streak');
      return data;
    }
  });
}

export function useUpdateStreak() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/streak');
      return data;
    }
  });
} 