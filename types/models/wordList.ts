import { User } from './user';
import { Card } from './card';

export interface WordList {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: User;
  cards: Card[];
  _count?: {
    cards: number;
  };
} 