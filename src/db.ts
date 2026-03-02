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

  // Dynamic Cycle Fields
  masteryLevel: number;    // 0..5
  discarded: boolean;
  correctStreak: number;
  lastSeenAt?: number;
  seenCount: number;
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

    this.version(2).stores({
      cards: '++id, deckId, nextReview, isNew, masteryLevel, discarded'
    }).upgrade(tx => {
      // Migration to add defaults to existing cards
      return tx.table('cards').toCollection().modify(card => {
        if (card.masteryLevel === undefined) card.masteryLevel = 0;
        if (card.discarded === undefined) card.discarded = false;
        if (card.correctStreak === undefined) card.correctStreak = 0;
        if (card.seenCount === undefined) card.seenCount = card.repetitions || 0;
        if (card.lastSeenAt === undefined) card.lastSeenAt = card.lastReview || 0;
      });
    });
  }
}

export const db = new AnkiCloneDB();
