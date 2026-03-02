import { Card } from '../db';

const LEVEL_WEIGHTS: Record<number, number> = {
    0: 10,
    1: 8,
    2: 5,
    3: 3,
    4: 1,
    5: 0.2
};

/**
 * Weighted random selector for cards.
 * @param cards The card list (already filtered by discarded=false).
 * @param seenInSessionIds IDs of cards already shown this session.
 * @param recentlySeenIds Last few card IDs to reduce their probability even further.
 * @returns A selected card or null if session is complete.
 */
export function selectNextCard(
    cards: Card[],
    seenInSessionIds: Set<number>,
    recentlySeenIds: number[]
): Card | null {
    // 1) Filter only cards NOT seen in this session
    const pool = cards.filter(c => !seenInSessionIds.has(c.id!));

    if (pool.length === 0) return null;

    // 2) Weighted selection within the pool
    const weightedPool = pool.map(card => {
        let weight = LEVEL_WEIGHTS[card.masteryLevel] ?? 1;

        // Drastically reduce probability of recently seen (even across sessions or cycles)
        if (recentlySeenIds.includes(card.id!)) {
            weight *= 0.01;
        }

        return { card, weight };
    });

    const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of weightedPool) {
        if (random < item.weight) return item.card;
        random -= item.weight;
    }

    return weightedPool[weightedPool.length - 1].card;
}
