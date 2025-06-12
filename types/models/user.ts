import { Account } from './account';
import { Session } from './session';
import { Card } from './card';
import { WordList } from './wordList';
import { CardProgress } from './cardProgress';
import { ReviewSchedule } from './reviewSchedule';
import { TestSession } from './testSession';
import { ReviewSession } from './reviewSession';

export interface User {
  id: string;
  name?: string;
  email?: string;
  emailVerified?: Date;
  image?: string;
  password?: string;
  accounts: Account[];
  sessions: Session[];
  cards: Card[];
  wordLists: WordList[];
  cardProgress: CardProgress[];
  lastTestDate?: Date;
  lastReviewDate?: Date;
  reviewSchedule?: ReviewSchedule;
  testSessions: TestSession[];
  currentStreak: number;
  longestStreak: number;
  streakUpdatedAt: Date;
  reviewSessions: ReviewSession[];
} 