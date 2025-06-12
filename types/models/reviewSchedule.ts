import { User } from './user';

export interface ReviewSchedule {
  id: string;
  userId: string;
  user: User;
  intervals: number[]; // Array of intervals in days (default: [1, 7, 30, 365])
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description?: string;
} 