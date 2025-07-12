import { useCallback, useMemo, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { ApiResponse } from '@/types/api';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

interface RefreshResponse {
  user: {
    rp_accessToken: string;
    rp_refreshToken: string;
  };
}

export const useApi = () => {
  const { data: session, update } = useSession();
  const isRefreshing = useRef(false);
  const failedQueue = useRef<Array<{ resolve: (value: any) => void; reject: (error: any) => void }>>([]);

  // Create axios instance
  const axiosInstance = useMemo(() => {
    const instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      withCredentials: true,
    });

    // Request interceptor to add auth token
    instance.interceptors.request.use(
      (config) => {
        if (session?.accessToken) {
          config.headers.Authorization = `Bearer ${session.accessToken}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    instance.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing.current) {
            // If already refreshing, add to queue
            return new Promise((resolve, reject) => {
              failedQueue.current.push({ resolve, reject });
            }).then(() => {
              return instance.request(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          isRefreshing.current = true;

          try {
            // Attempt to refresh token
            const refreshResponse = await axios.post<ApiResponse<RefreshResponse>>(
              `${API_BASE_URL}/auth/refresh`,
              {},
              {
                headers: {
                  'Content-Type': 'application/json',
                },
                withCredentials: true,
              }
            );

            if (refreshResponse.data.status === 'success' && refreshResponse.data.data) {
              const { rp_accessToken, rp_refreshToken } = refreshResponse.data.data.user;
              // Update session with new tokens
              await update({
                ...session,
                accessToken: rp_accessToken,
                refreshToken: rp_refreshToken,
              });

              // Retry original request with new token
              originalRequest.headers.Authorization = `Bearer ${rp_accessToken}`;
              // Process queued requests
              failedQueue.current.forEach(({ resolve }) => {
                resolve(undefined);
              });
              failedQueue.current = [];

              return instance.request(originalRequest);
            } else {
              throw new Error('Token refresh failed');
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Clear session and redirect to login
            await signOut({ redirect: true, callbackUrl: '/auth/signin' });
            // Reject queued requests
            failedQueue.current.forEach(({ reject }) => {
              reject(refreshError);
            });
            failedQueue.current = [];
            return Promise.reject(refreshError);
          } finally {
            isRefreshing.current = false;
          }
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, [session, update]);

  const request = useCallback(async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
    const { method = 'GET', body, headers = {} } = options;

    const config: AxiosRequestConfig = {
      method: method.toLowerCase(),
      url: endpoint,
      headers,
    };

    if (body) {
      if (body instanceof FormData) {
        config.data = body;
        // Don't set Content-Type for FormData, let axios set it with boundary
      } else {
        config.data = body;
      }
    }

    try {
      const response = await axiosInstance(config);
      const result = response.data as ApiResponse<T>;

      if (result.status === 'error') {
        throw new Error(result.message || 'Something went wrong');
      }

      if (result.data === null) {
        throw new Error('No data received from server');
      }

      return result.data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }, [axiosInstance]);

  return useMemo(() => ({
    get: <T>(endpoint: string, headers?: Record<string, string>) => 
      request<T>(endpoint, { method: 'GET', headers }),
    
    post: <T>(endpoint: string, body: any, headers?: Record<string, string>) => 
      request<T>(endpoint, { method: 'POST', body, headers }),
    
    put: <T>(endpoint: string, body: any, headers?: Record<string, string>) => 
      request<T>(endpoint, { method: 'PUT', body, headers }),
    
    delete: <T>(endpoint: string, headers?: Record<string, string>) => 
      request<T>(endpoint, { method: 'DELETE', headers }),
  }), [request]);
}; 