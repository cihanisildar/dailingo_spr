import { Card } from './card';

export interface Review {
  id: string;
  cardId: string;
  card: Card;
  isSuccess: boolean;
  createdAt: Date;
} 