import { TestSession } from './testSession';
import { Card } from './card';

export interface TestResult {
  id: string;
  sessionId: string;
  session: TestSession;
  cardId: string;
  card: Card;
  isCorrect: boolean;
  timeSpent: number;
  createdAt: Date;
} 