import { useCallback } from 'react';
import { useApi } from './useApi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/types/models/card';
import { format } from 'date-fns';

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

interface CardStats {
  totalCards: number;
  reviewedToday: number;
  dueToday: number;
  dueTomorrow: number;
  currentStreak: number;
  completedCards: number;
  activeCards: number;
  needsReview: number;
}

interface ExtendedCard extends Card {
  isFromFailure: boolean;
  reviewStep: number;
}

export interface GroupedCards {
  total: number;
  reviewed: number;
  notReviewed: number;
  fromFailure: number;
  cards: ExtendedCard[];
}

interface UpcomingReviewsResponse {
  data: {
    cards: Card[];
    total: number;
  };
  status: string;
  message: string;
}

interface UpcomingReviews {
  cards: Record<string, GroupedCards>;
  total: number;
  intervals: number[];
}

export const useCards = () => {
  const api = useApi();

  const getCards = useCallback(async () => {
    return api.get<Card[]>('/cards');
  }, [api]);

  const getCard = useCallback(async (id: string) => {
    return api.get<Card>(`/cards/${id}`);
  }, [api]);

  const createCard = useCallback(async (data: Omit<Card, 'id'>) => {
    return api.post<Card>('/cards', data);
  }, [api]);

  const updateCard = useCallback(async (id: string, data: Partial<Card>) => {
    return api.put<Card>(`/cards/${id}`, data);
  }, [api]);

  const deleteCard = useCallback(async (id: string) => {
    return api.delete<{ message: string }>(`/cards/${id}`);
  }, [api]);

  const deleteBulkCards = useCallback(async (cardIds: string[]) => {
    return api.post<{ success: number; failed: number; errors: string[] }>('/cards/bulk-delete', { cardIds });
  }, [api]);

  const getTodayCards = useCallback(async () => {
    return api.get<Card[]>('/cards/today');
  }, [api]);

  const getUpcomingCards = useCallback(async () => {
    return api.get<Card[]>('/cards/upcoming');
  }, [api]);

  const getCardStats = useCallback(async () => {
    return api.get<CardStats>('/cards/stats');
  }, [api]);

  const submitCardResult = useCallback(async (data: {
    wordId: string;
    isCorrect: boolean;
    timeSpent: number;
    isPublicCard?: boolean;
  }) => {
    return api.post<{ success: boolean }>('/word-result', data);
  }, [api]);

  const importCards = useCallback(async (data: FormData | { text: string }) => {
    return api.post<{ success: number; failed: number; errors: string[] }>('/cards/import', data);
  }, [api]);

  return {
    getCards,
    getCard,
    createCard,
    updateCard,
    deleteCard,
    deleteBulkCards,
    getTodayCards,
    getUpcomingCards,
    getCardStats,
    submitCardResult,
    importCards,
  };
};

// Hooks
export function useTodayCards(options?: { repeat?: boolean }) {
  const api = useApi();
  const repeat = options?.repeat;
  return useQuery({
    queryKey: [...cardKeys.today(), { repeat }],
    queryFn: async () => {
      const url = repeat ? '/cards/today?repeat=true' : '/cards/today';
      return api.get<Card[]>(url);
    },
  });
}

export function useCard(id: string) {
  const api = useApi();
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: async () => {
      return api.get<Card>(`/cards/${id}`);
    },
  });
}

interface CreateCardData {
  word: string;
  definition: string;
}

export function useCreateCard() {
  const queryClient = useQueryClient();
  const api = useApi();

  return useMutation({
    mutationFn: async (data: CreateCardData) => {
      return api.post<Card>("/cards", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();
  const api = useApi();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Card> }) => {
      return api.put<Card>(`/cards/${id}`, data);
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
  const api = useApi();

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

export function useBulkDeleteCards() {
  const queryClient = useQueryClient();
  const api = useApi();

  return useMutation({
    mutationFn: async (cardIds: string[]) => {
      const result = await api.post<{ success: number; failed: number; errors: string[] }>('/cards/bulk-delete', { cardIds });
      return { cardIds, result };
    },
    onMutate: async (deletedIds) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["cards"] });
      
      // Cancel queries for individual cards
      deletedIds.forEach(id => {
        queryClient.cancelQueries({ queryKey: cardKeys.detail(id) });
      });

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData(["cards"]);

      // Optimistically update the cache
      queryClient.setQueryData(["cards"], (old: Card[] | undefined) => {
        if (!old) return [];
        return old.filter(card => !deletedIds.includes(card.id));
      });

      // Remove the individual card queries from cache
      deletedIds.forEach(id => {
        queryClient.removeQueries({ queryKey: cardKeys.detail(id) });
      });

      // Return a context object with the snapshotted value
      return { previousCards };
    },
    onError: (err, deletedIds, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCards) {
        queryClient.setQueryData(["cards"], context.previousCards);
      }
    },
    onSettled: (data) => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      if (data?.cardIds) {
        data.cardIds.forEach(id => {
          queryClient.invalidateQueries({ queryKey: cardKeys.detail(id) });
        });
      }
      // Also invalidate related queries that might be affected
      queryClient.invalidateQueries({ queryKey: cardKeys.today() });
      queryClient.invalidateQueries({ queryKey: cardKeys.upcoming(365) });
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();
  const api = useApi();

  return useMutation({
    mutationFn: async ({ cardId, isSuccess }: { cardId: string; isSuccess: boolean }) => {
      return api.post('/cards/review', { cardId, isSuccess });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cardKeys.today() });
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["stats"] }); // Invalidate stats to update reviewedToday
    },
  });
}

export function useUpcomingReviews() {
  const api = useApi();
  return useQuery<UpcomingReviews>({
    queryKey: cardKeys.upcoming(365),
    queryFn: async () => {
      const response = await api.get<UpcomingReviews>(`/cards/upcoming?days=365`);
      if (
        response &&
        typeof response === "object" &&
        response.cards &&
        typeof response.cards === "object" &&
        !Array.isArray(response.cards) &&
        "intervals" in response &&
        "total" in response
      ) {
        return response as UpcomingReviews;
      }
      return { cards: {}, total: 0, intervals: [] };
    },
  });
} 