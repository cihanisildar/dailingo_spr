import { User } from './user';
import { WordList } from './wordList';
import { WordDetails } from './wordDetails';
import { CardProgress } from './cardProgress';
import { TestResult } from './testResult';
import { Review } from './review';
import { ReviewStatus } from '../enums/reviewStatus';

export interface Card {
  id: string;
  word: string;
  definition: string;
  viewCount: number;
  successCount: number;
  failureCount: number;
  lastReviewed?: Date;
  nextReview: Date;
  reviewStatus: ReviewStatus;
  reviewStep: number;
  interval: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  wordListId?: string;
  user: User;
  wordList?: WordList;
  wordDetails?: WordDetails;
  progress: CardProgress[];
  testResults: TestResult[];
  reviews: Review[];
} 