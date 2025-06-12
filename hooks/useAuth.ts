import { useCallback } from 'react';
import { useApi } from './useApi';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export const useAuth = () => {
  const api = useApi();

  const login = useCallback(async (credentials: LoginCredentials) => {
    return api.post<{ user: UserProfile }>('/auth/login', credentials);
  }, [api]);

  const register = useCallback(async (data: RegisterData) => {
    return api.post<{ user: UserProfile }>('/auth/register', data);
  }, [api]);

  const getProfile = useCallback(async () => {
    return api.get<UserProfile>('/user');
  }, [api]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    return api.put<UserProfile>('/user/profile', data);
  }, [api]);

  const deleteAccount = useCallback(async () => {
    return api.delete<{ message: string }>('/user/delete');
  }, [api]);

  return {
    login,
    register,
    getProfile,
    updateProfile,
    deleteAccount,
  };
}; 