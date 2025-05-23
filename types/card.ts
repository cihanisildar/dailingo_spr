export type ReviewStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export interface Card {
  id: string;
  word: string;
  definition: string;
  example?: string;
  notes?: string;
  intervalDuration: number;
  reviewEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastReviewed: Date;
  nextReview: Date;
  interval: number;
  reviewStatus: ReviewStatus;
  reviewStartDate: Date;
  viewCount: number;
  reviewStep: number;
  successCount: number;
  failureCount: number;
  userId: string;
  wordListId?: string;
  wordDetailsId?: string;
  wordDetails?: WordDetails;
  wordList?: WordList;
}

export interface WordDetails {
  id: string;
  cardId: string;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WordList {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  userId: string;
  _count?: {
    cards: number;
  };
} 