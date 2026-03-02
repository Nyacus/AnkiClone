import Dexie, { Table } from 'dexie';

export interface Deck {
  id?: number;
  name: string;
  createdAt: number;
}

export interface Card {
  id?: number;
  deckId: number;
  front: string;
  back: string;
  direction: string;
  tags: string[];
  isNew: boolean;
  interval: number;
  easeFactor: number;
  repetitions: number;
  lapseCount: number;
  lastReview: number;
  nextReview: number;
}

export class AnkiCloneDB extends Dexie {
  decks!: Table<Deck>;
  cards!: Table<Card>;

  constructor() {
    super('AnkiCloneDB');
    this.version(1).stores({
      decks: '++id, name',
      cards: '++id, deckId, nextReview, isNew'
    });
  }
}

export const db = new AnkiCloneDB();
