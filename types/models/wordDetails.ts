import { Card } from './card';

export interface WordDetails {
  id: string;
  cardId: string;
  card: Card;
  synonyms: string[];
  antonyms: string[];
  examples: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
} 