import { User } from './user';
import { TestResult } from './testResult';

export interface TestSession {
  id: string;
  userId: string;
  user: User;
  createdAt: Date;
  results: TestResult[];
} 