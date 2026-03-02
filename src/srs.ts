import { Card } from './db';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export function calculateNextReview(card: Card, grade: Grade): Card {
  const now = Date.now();

  // Clone the numeric values to modify
  let { masteryLevel, correctStreak, lapseCount, seenCount } = card;

  switch (grade) {
    case 'again':
      masteryLevel = Math.max(0, masteryLevel - 1);
      correctStreak = 0;
      lapseCount += 1;
      break;
    case 'hard':
      masteryLevel = Math.max(0, masteryLevel - 1);
      correctStreak = 0;
      break;
    case 'good':
      masteryLevel = Math.min(5, masteryLevel + 1);
      correctStreak += 1;
      break;
    case 'easy':
      masteryLevel = Math.min(5, masteryLevel + 2);
      correctStreak += 1;
      break;
  }

  return {
    ...card,
    isNew: false,
    masteryLevel,
    correctStreak,
    lapseCount,
    lastSeenAt: now,
    seenCount: (seenCount || 0) + 1,
    // Keep SM-2 fields updated just in case for compatibility, though we'll use masteryLevel for selection
    repetitions: (card.repetitions || 0) + 1,
    nextReview: now // This field won't be used for our new weighted selection logic
  };
}
