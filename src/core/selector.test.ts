import { describe, it, expect } from 'vitest';
import { selectNextCard } from './selector';
import { Card } from '../db';

const mockCards: Card[] = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    deckId: 1,
    front: `Front ${i}`,
    back: `Back ${i}`,
    direction: 'en-es',
    tags: [],
    isNew: false,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapseCount: 0,
    lastReview: 0,
    nextReview: 0,
    masteryLevel: i < 6 ? i : 0, // 0, 1, 2, 3, 4, 5
    discarded: false,
    correctStreak: 0,
    seenCount: 0
}));

describe('selectNextCard (Weighted Selection Algorithm)', () => {
    it('should return null if the pool is empty', () => {
        const next = selectNextCard([], new Set(), []);
        expect(next).toBeNull();
    });

    it('should return null if all cards are seen in session', () => {
        const seen = new Set([0, 1, 2, 3, 4, 5]);
        const next = selectNextCard(mockCards, seen, []);
        expect(next).toBeNull();
    });

    it('should not choose a card seen in session', () => {
        const seen = new Set([0, 1, 2, 3, 4]);
        const next = selectNextCard(mockCards, seen, []);
        expect(next?.id).toBe(5);
    });

    it('should drastically reduce the probability of recently seen cards', () => {
        // If we only have two cards, and one is recently seen
        const twoCards = [mockCards[0], mockCards[1]]; // Level 0 and 1
        const seen = new Set<number>();
        const recentlySeen = [1]; // Card 1 is recently seen

        // Level 0 weight = 10, Level 1 weight = 8
        // With recentlySeen[1], weight of Card 1 = 8 * 0.01 = 0.08
        // Total weight = 10 + 0.08 = 10.08
        // Probability of Card 1 = 0.08 / 10.08 (~0.79%)
        // Let's run a small loop to see if it favors Card 0
        let count0 = 0;
        for (let i = 0; i < 100; i++) {
            if (selectNextCard(twoCards, seen, recentlySeen)?.id === 0) count0++;
        }
        expect(count0).toBeGreaterThan(90);
    });

    it('should respect the weighted levels (statistically speaking)', () => {
        // Level 0 weight = 10, Level 5 weight = 0.2
        const filtered = [mockCards[0], mockCards[5]];
        const seen = new Set<number>();

        let count0 = 0;
        for (let i = 0; i < 100; i++) {
            if (selectNextCard(filtered, seen, [])?.id === 0) count0++;
        }
        // Level 0 probability is 10 / 10.2 (~98%)
        expect(count0).toBeGreaterThan(90);
    });
});
