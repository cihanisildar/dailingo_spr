import { useCallback } from 'react';
import { useApi } from './useApi';

interface UserSettings {
  emailNotifications: boolean;
  reviewReminders: boolean;
  publicProfile: boolean;
  shareStatistics: boolean;
}

export const useSettings = () => {
  const api = useApi();

  const getSettings = useCallback(async () => {
    return api.get<UserSettings>('/user/settings');
  }, [api]);

  const updateSettings = useCallback(async (settings: Partial<UserSettings>) => {
    return api.put<UserSettings>('/user/settings', settings);
  }, [api]);

  const deleteAccount = useCallback(async () => {
    return api.delete<{ message: string }>('/user/delete');
  }, [api]);

  return {
    getSettings,
    updateSettings,
    deleteAccount,
  };
}; 