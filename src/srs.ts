import { Card } from './db';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export function calculateNextReview(card: Card, grade: Grade): Card {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  
  let { interval, easeFactor, repetitions, lapseCount } = card;

  switch (grade) {
    case 'again':
      repetitions = 0;
      interval = 0; // Due immediately (learning step)
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      lapseCount += 1;
      break;
    case 'hard':
      interval = Math.max(1, interval * 1.2);
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      break;
    case 'good':
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
      break;
    case 'easy':
      if (repetitions === 0) interval = 4;
      else if (repetitions === 1) interval = 10;
      else interval = Math.round(interval * easeFactor * 1.3);
      easeFactor += 0.15;
      repetitions += 1;
      break;
  }

  // If interval is 0 (again), nextReview is now + 10 minutes
  // Otherwise, it's now + interval days
  const nextReview = interval === 0 
    ? now + 10 * 60 * 1000 
    : now + interval * ONE_DAY;

  return {
    ...card,
    isNew: false,
    interval,
    easeFactor,
    repetitions,
    lapseCount,
    lastReview: now,
    nextReview
  };
}
