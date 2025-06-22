import { useCallback } from 'react';
import { useApi } from './useApi';
import { Card } from '@/types/models/card';
import { WordList } from '@/types/models/wordList';


export const useLists = () => {
  const api = useApi();

  const getLists = useCallback(async (includePublic: boolean = false) => {
    return api.get<WordList[]>(`/lists?includePublic=${includePublic}`);
  }, [api]);

  const getList = useCallback(async (id: string) => {
    return api.get<WordList>(`/lists/${id}`);
  }, [api]);

  const createList = useCallback(async (data: {
    name: string;
    description?: string;
    isPublic?: boolean;
  }) => {
    return api.post<WordList>('/lists', data);
  }, [api]);

  const updateList = useCallback(async (id: string, data: Partial<WordList>) => {
    return api.put<WordList>(`/lists/${id}`, data);
  }, [api]);

  const deleteList = useCallback(async (id: string) => {
    return api.delete<{ message: string }>(`/lists/${id}`);
  }, [api]);

  const getListCards = useCallback(async (id: string) => {
    return api.get<Card[]>(`/lists/${id}/cards`);
  }, [api]);

  const getAvailableCards = useCallback(async (wordListId: string) => {
    return api.get<Card[]>(`/cards/available?wordListId=${wordListId}`);
  }, [api]);

  const addCardsToList = useCallback(async (listId: string, cardIds: string[]) => {
    return api.post<{ message: string }>(`/lists/${listId}/cards`, { cardIds });
  }, [api]);

  const removeCardsFromList = useCallback(async (listId: string, cardIds: string[]) => {
    return api.post<{ message: string }>(`/lists/${listId}/remove-cards`, { cardIds });
  }, [api]);

  const copyList = useCallback(async (sourceListId: string) => {
    return api.post('/lists/copy', { sourceListId });
  }, [api]);

  const deleteListWithCards = useCallback(async (id: string, deleteCards: boolean) => {
    return api.delete(`/lists/${id}?deleteCards=${deleteCards}`);
  }, [api]);

  return {
    getLists,
    getList,
    createList,
    updateList,
    deleteList,
    getListCards,
    getAvailableCards,
    addCardsToList,
    removeCardsFromList,
    copyList,
    deleteListWithCards,
  };
}; 