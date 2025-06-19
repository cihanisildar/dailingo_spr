import { useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export const useApi = () => {
  const { data: session } = useSession();
  // Use the accessToken property from session
  const token = session?.accessToken;
  
  const request = useCallback(async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers = {} } = options;

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const fetchHeaders: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    };
    if (token) {
      fetchHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/api${endpoint}`, {
      method,
      headers: fetchHeaders,
      credentials: 'include', // Always send cookies as well
      ...(body && { body: isFormData ? body : JSON.stringify(body) }),
    });

    console.log('Raw API response:', await response.clone().text());
    
    const result = await response.json() as ApiResponse<T>;
    console.log('Parsed API response:', result);

    if (result.status === 'error' || !response.ok) {
      throw new Error(result.message || 'Something went wrong');
    }

    if (result.data === null) {
      throw new Error('No data received from server');
    }

    return result.data as T;
  }, [token]);

  return {
    get: <T>(endpoint: string, headers?: Record<string, string>) => 
      request<T>(endpoint, { method: 'GET', headers }),
    
    post: <T>(endpoint: string, body: any, headers?: Record<string, string>) => 
      request<T>(endpoint, { method: 'POST', body, headers }),
    
    put: <T>(endpoint: string, body: any, headers?: Record<string, string>) => 
      request<T>(endpoint, { method: 'PUT', body, headers }),
    
    delete: <T>(endpoint: string, headers?: Record<string, string>) => 
      request<T>(endpoint, { method: 'DELETE', headers }),
  };
}; 