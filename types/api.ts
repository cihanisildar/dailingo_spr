export interface ApiResponse<T = any> {
  data: T | null;
  status: 'success' | 'error';
  message: string;
} 