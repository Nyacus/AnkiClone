import { describe, it, expect } from 'vitest';
import { calculateNextReview } from './srs';
import { Card } from './db';

const mockCard: Card = {
    id: 1,
    deckId: 1,
    front: 'Front',
    back: 'Back',
    direction: 'en-es',
    tags: [],
    isNew: true,
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapseCount: 0,
    lastReview: 0,
    nextReview: 0,
    masteryLevel: 0,
    discarded: false,
    correctStreak: 0,
    seenCount: 0
};

describe('calculateNextReview (Dynamic Cycle Algorithm)', () => {
    it('should decrease masteryLevel on "again" but not below 0', () => {
        const cardMid = { ...mockCard, masteryLevel: 3 };
        const updated = calculateNextReview(cardMid, 'again');
        expect(updated.masteryLevel).toBe(2);
        expect(updated.correctStreak).toBe(0);
        expect(updated.lapseCount).toBe(1);

        const cardZero = { ...mockCard, masteryLevel: 0 };
        const updatedZero = calculateNextReview(cardZero, 'again');
        expect(updatedZero.masteryLevel).toBe(0);
    });

    it('should decrease masteryLevel on "hard" but not below 0', () => {
        const cardMid = { ...mockCard, masteryLevel: 3 };
        const updated = calculateNextReview(cardMid, 'hard');
        expect(updated.masteryLevel).toBe(2);
        expect(updated.correctStreak).toBe(0);
    });

    it('should increase masteryLevel by 1 on "good"', () => {
        const updated = calculateNextReview(mockCard, 'good');
        expect(updated.masteryLevel).toBe(1);
        expect(updated.correctStreak).toBe(1);
    });

    it('should increase masteryLevel by 2 on "easy"', () => {
        const updated = calculateNextReview(mockCard, 'easy');
        expect(updated.masteryLevel).toBe(2);
        expect(updated.correctStreak).toBe(1);
    });

    it('should clamp masteryLevel at 5', () => {
        const cardMax = { ...mockCard, masteryLevel: 5 };
        const updatedGood = calculateNextReview(cardMax, 'good');
        expect(updatedGood.masteryLevel).toBe(5);

        const cardNearlyMax = { ...mockCard, masteryLevel: 4 };
        const updatedEasy = calculateNextReview(cardNearlyMax, 'easy');
        expect(updatedEasy.masteryLevel).toBe(5);
    });

    it('should update seenCount and lastSeenAt', () => {
        const updated = calculateNextReview(mockCard, 'good');
        expect(updated.seenCount).toBe(1);
        expect(updated.lastSeenAt).toBeGreaterThan(0);
    });
});
