import { User } from './user';

export interface ReviewSession {
  id: string;
  userId: string;
  startedAt: Date;
  completedAt?: Date;
  isRepeat: boolean;
  mode: string; // 'flashcard' or 'multiple-choice'
  cards: any; // JSON type for card IDs or details
  user: User;
} 