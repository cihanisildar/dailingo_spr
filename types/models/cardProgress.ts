import { User } from './user';
import { Card } from './card';

export interface CardProgress {
  id: string;
  viewCount: number;
  successCount: number;
  failureCount: number;
  lastReviewed?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  originalCardId: string;
  user: User;
  originalCard: Card;
} 