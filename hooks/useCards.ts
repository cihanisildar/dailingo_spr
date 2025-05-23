import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Card } from '@/types/card';

// Query keys
export const cardKeys = {
  all: ['cards'] as const,
  lists: () => [...cardKeys.all, 'list'] as const,
  list: (filters: string) => [...cardKeys.lists(), { filters }] as const,
  details: () => [...cardKeys.all, 'detail'] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
  today: () => [...cardKeys.all, 'today'] as const,
  upcoming: (days: number) => [...cardKeys.all, 'upcoming', days] as const,
};

// Hooks
export function useCards() {
  return useQuery<Card[]>({
    queryKey: ["cards"],
    queryFn: async () => {
      const response = await api.get("/cards");
      return response.data;
    },
  });
}

export function useTodayCards() {
  return useQuery({
    queryKey: cardKeys.today(),
    queryFn: async () => {
      const { data } = await api.get('/cards/today');
      return data;
    },
  });
}

export function useCard(id: string) {
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Card>(`/cards/${id}`);
      return data;
    },
  });
}

interface CreateCardData {
  word: string;
  definition: string;
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCardData) => {
      const response = await api.post("/cards", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Card> }) => {
      const response = await api.put<Card>(`/cards/${id}`, data);
      return response.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: cardKeys.all });
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(id) });

      // Snapshot the previous values
      const previousCard = queryClient.getQueryData<Card>(cardKeys.detail(id));
      const previousCards = queryClient.getQueryData<Card[]>(cardKeys.all);

      // Optimistically update both caches
      const updatedCard = { ...previousCard, ...data };
      queryClient.setQueryData(cardKeys.detail(id), updatedCard);
      
      if (previousCards) {
        const updatedCards = previousCards.map(card => 
          card.id === id ? updatedCard : card
        );
        queryClient.setQueryData(cardKeys.all, updatedCards);
      }

      return { previousCard, previousCards };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousCard) {
        queryClient.setQueryData(cardKeys.detail(variables.id), context.previousCard);
      }
      if (context?.previousCards) {
        queryClient.setQueryData(cardKeys.all, context.previousCards);
      }
    },
    onSettled: (data) => {
      // Always invalidate relevant queries after settling
      queryClient.invalidateQueries({ queryKey: cardKeys.all });
      if (data) {
        queryClient.invalidateQueries({ queryKey: cardKeys.detail(data.id) });
      }
      // Also invalidate related queries that might be affected
      queryClient.invalidateQueries({ queryKey: cardKeys.today() });
      queryClient.invalidateQueries({ queryKey: cardKeys.upcoming(365) });
    },
  });
}

export function useDeleteCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cards/${id}`);
      return id; // Return the id for use in onSuccess
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["cards"] });
      await queryClient.cancelQueries({ queryKey: cardKeys.detail(deletedId) });

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData(["cards"]);

      // Optimistically update the cache
      queryClient.setQueryData(["cards"], (old: Card[] | undefined) => {
        if (!old) return [];
        return old.filter(card => card.id !== deletedId);
      });

      // Remove the individual card query from cache
      queryClient.removeQueries({ queryKey: cardKeys.detail(deletedId) });

      // Return a context object with the snapshotted value
      return { previousCards };
    },
    onError: (err, deletedId, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCards) {
        queryClient.setQueryData(["cards"], context.previousCards);
      }
    },
    onSettled: (deletedId) => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      if (deletedId) {
        queryClient.invalidateQueries({ queryKey: cardKeys.detail(deletedId) });
      }
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, isSuccess }: { cardId: string; isSuccess: boolean }) => {
      const { data } = await api.post('/cards/review', { cardId, isSuccess });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.today() });
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
  });
}

export function useUpcomingReviews<T = any>() {
  return useQuery<T>({
    queryKey: cardKeys.upcoming(365),
    queryFn: async () => {
      const { data } = await api.get(`/cards/upcoming?days=365`);
      return data;
    },
  });
} 