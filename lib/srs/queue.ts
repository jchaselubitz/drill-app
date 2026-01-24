import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';

import { SrsCard, SrsReviewLog } from '@/database/models';
import { SRS_CARD_TABLE, SRS_REVIEW_LOG_TABLE } from '@/database/schema';
import type { SrsCardState } from '@/types';

import { getStudyDayStart } from './time';

const REVIEW_STATES: SrsCardState[] = ['learning', 'review', 'relearning'];

export const getDailyLimitsRemaining = async (
  db: Database,
  {
    deckId,
    now,
    dayStartHour,
    maxNewPerDay,
    maxReviewsPerDay,
  }: {
    deckId: string;
    now: Date;
    dayStartHour: number;
    maxNewPerDay: number;
    maxReviewsPerDay: number;
  }
) => {
  const dayStart = getStudyDayStart(now, dayStartHour);
  const dayStartMs = dayStart.getTime();

  const reviewLogCollection = db.collections.get<SrsReviewLog>(SRS_REVIEW_LOG_TABLE);

  const newCount = await reviewLogCollection
    .query(
      Q.where('deck_id', deckId),
      Q.where('reviewed_at', Q.gte(dayStartMs)),
      Q.where('state_before', 'new')
    )
    .fetchCount();

  const reviewCount = await reviewLogCollection
    .query(
      Q.where('deck_id', deckId),
      Q.where('reviewed_at', Q.gte(dayStartMs)),
      Q.where('state_before', Q.notEq('new'))
    )
    .fetchCount();

  return {
    newRemaining: Math.max(0, maxNewPerDay - newCount),
    reviewsRemaining: Math.max(0, maxReviewsPerDay - reviewCount),
    newDone: newCount,
    reviewsDone: reviewCount,
  };
};

export const getReviewQueue = async (
  db: Database,
  {
    deckId,
    nowMs,
    reviewsRemaining,
    newRemaining,
  }: {
    deckId: string;
    nowMs: number;
    reviewsRemaining: number;
    newRemaining: number;
  }
): Promise<SrsCard[]> => {
  const cardCollection = db.collections.get<SrsCard>(SRS_CARD_TABLE);

  // Only fetch due review cards (cards in learning/review/relearning state that are actually due)
  const reviewCards = await cardCollection
    .query(
      Q.where('deck_id', deckId),
      Q.where('suspended', false),
      Q.where('state', Q.oneOf(REVIEW_STATES)),
      Q.where('due_at', Q.lte(nowMs)),
      Q.sortBy('due_at', Q.asc),
      Q.take(reviewsRemaining)
    )
    .fetch();

  // Only fetch new cards if we have remaining quota AND haven't already hit max for the day
  const newCards =
    newRemaining > 0
      ? await cardCollection
          .query(
            Q.where('deck_id', deckId),
            Q.where('suspended', false),
            Q.where('state', 'new'),
            Q.where('due_at', Q.lte(nowMs)),
            Q.sortBy('created_at', Q.asc),
            Q.take(newRemaining)
          )
          .fetch()
      : [];

  const allCards = [...reviewCards, ...newCards];
  // Sort by urgency (due_at) while maintaining separation of opposite pairs
  return sortCardsMaintainingSeparation(allCards);
};

/**
 * Given a queue of cards, find the index of the next card that is actually due.
 */
export const getNextDueCardIndex = ({
  queue,
  nowMs,
  startIndex,
}: {
  queue: SrsCard[];
  nowMs: number;
  startIndex: number;
}): number | null => {
  let index = startIndex;

  while (index < queue.length) {
    const card = queue[index];
    if (card.dueAt <= nowMs) {
      return index;
    }
    index++;
  }

  return null;
};

// Minimum spacing between cards with the same translation_id
const MIN_CARD_SPACING = 4;

/**
 * Check if a position in the queue would place a card too close to another
 * card with the same translation_id. Cards must be at least MIN_CARD_SPACING apart.
 */
const wouldViolateSpacing = (
  queue: SrsCard[],
  insertIndex: number,
  translationId: string
): boolean => {
  // Check cards within MIN_CARD_SPACING-1 positions before and after the insert position
  const checkRange = MIN_CARD_SPACING - 1; // Cards at distance < MIN_CARD_SPACING would violate

  for (let offset = -checkRange; offset <= checkRange; offset++) {
    if (offset === 0) continue; // Skip the insertion position itself

    const checkIndex = insertIndex + (offset < 0 ? offset : offset - 1);
    if (checkIndex >= 0 && checkIndex < queue.length) {
      if (queue[checkIndex].translationId === translationId) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Insert a card into a queue, maintaining urgency order (by due_at) while
 * ensuring cards with the same translation_id are at least MIN_CARD_SPACING apart.
 *
 * Strategy:
 * 1. Find the earliest position where the card's due_at fits
 * 2. If that position would violate spacing, find the next valid position
 * 3. If no valid position exists (all cards have same translation_id), append to end
 */
export const insertCardMaintainingSeparation = (queue: SrsCard[], card: SrsCard): SrsCard[] => {
  const newQueue = [...queue];

  // Find the earliest position where this card's due_at fits
  let insertIndex = 0;
  for (let i = 0; i < newQueue.length; i++) {
    if (card.dueAt <= newQueue[i].dueAt) {
      insertIndex = i;
      break;
    }
    insertIndex = i + 1;
  }

  // Check if inserting at this position would violate spacing requirements
  if (!wouldViolateSpacing(newQueue, insertIndex, card.translationId)) {
    // Safe to insert at the ideal position
    newQueue.splice(insertIndex, 0, card);
    return newQueue;
  }

  // Find the next valid position that maintains urgency while respecting spacing
  for (let i = insertIndex + 1; i <= newQueue.length; i++) {
    if (!wouldViolateSpacing(newQueue, i, card.translationId)) {
      newQueue.splice(i, 0, card);
      return newQueue;
    }
  }

  // Try looking backward from the ideal position
  for (let i = insertIndex - 1; i >= 0; i--) {
    if (!wouldViolateSpacing(newQueue, i, card.translationId)) {
      newQueue.splice(i, 0, card);
      return newQueue;
    }
  }

  // If we couldn't find a valid position (edge case: all cards have same translation_id),
  // append to end - this maintains urgency as much as possible
  newQueue.push(card);
  return newQueue;
};

/**
 * Apply a rescheduled card to the in-memory queue.
 * - Removes the current card from the queue
 * - If the card is still due today, reinserts it using separation-aware insertion
 * - Computes the next starting index for iteration
 */
export const applyCardRescheduleToQueue = ({
  queue,
  currentCardId,
  refreshedCard,
  tomorrowStartMs,
  currentIndex,
}: {
  queue: SrsCard[];
  currentCardId: string;
  refreshedCard: SrsCard | null;
  tomorrowStartMs: number;
  currentIndex: number;
}): { queue: SrsCard[]; nextStartIndex: number } => {
  const isDueToday = refreshedCard !== null && refreshedCard.dueAt < tomorrowStartMs;

  // Remove the current card from the queue
  let newQueue = queue.filter((card) => card.id !== currentCardId);

  // Optionally reinsert if still due today
  if (isDueToday && refreshedCard) {
    newQueue = insertCardMaintainingSeparation(newQueue, refreshedCard);
  }

  // Determine the next index to start from
  let nextStartIndex = currentIndex;

  if (isDueToday && refreshedCard) {
    const reinsertedIndex = newQueue.findIndex((card) => card.id === refreshedCard.id);
    if (reinsertedIndex !== -1 && reinsertedIndex <= currentIndex) {
      // Card was inserted at or before our position, skip over it
      nextStartIndex = currentIndex + 1;
    }
  }

  // If the queue shrank and nextStartIndex is now out of bounds, clamp it
  if (nextStartIndex >= newQueue.length) {
    nextStartIndex = Math.max(0, newQueue.length - 1);
  }

  return { queue: newQueue, nextStartIndex };
};

/**
 * Find the first spacing violation in the result array.
 * Returns the indices [i, j] where cards are too close, or null if no violation.
 */
const findSpacingViolation = (result: SrsCard[]): [number, number] | null => {
  for (let i = 0; i < result.length; i++) {
    // Check cards within MIN_CARD_SPACING-1 positions ahead
    for (let offset = 1; offset < MIN_CARD_SPACING && i + offset < result.length; offset++) {
      if (result[i].translationId === result[i + offset].translationId) {
        return [i, i + offset];
      }
    }
  }
  return null;
};

/**
 * Check if swapping positions a and b would create any new spacing violations.
 */
const wouldSwapCreateViolation = (
  result: SrsCard[],
  posA: number,
  posB: number
): boolean => {
  // Temporarily swap to check
  const cardA = result[posA];
  const cardB = result[posB];

  // Check if cardB at posA would violate spacing
  for (let offset = 1; offset < MIN_CARD_SPACING; offset++) {
    // Check positions before posA
    if (posA - offset >= 0 && posA - offset !== posB) {
      if (result[posA - offset].translationId === cardB.translationId) {
        return true;
      }
    }
    // Check positions after posA
    if (posA + offset < result.length && posA + offset !== posB) {
      if (result[posA + offset].translationId === cardB.translationId) {
        return true;
      }
    }
  }

  // Check if cardA at posB would violate spacing
  for (let offset = 1; offset < MIN_CARD_SPACING; offset++) {
    // Check positions before posB
    if (posB - offset >= 0 && posB - offset !== posA) {
      if (result[posB - offset].translationId === cardA.translationId) {
        return true;
      }
    }
    // Check positions after posB
    if (posB + offset < result.length && posB + offset !== posA) {
      if (result[posB + offset].translationId === cardA.translationId) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Sort cards by due_at while ensuring cards with the same translation_id
 * are at least MIN_CARD_SPACING positions apart.
 * This is used for the initial queue creation.
 */
export const sortCardsMaintainingSeparation = (cards: SrsCard[]): SrsCard[] => {
  if (cards.length <= 1) return cards;

  // First, sort by due_at
  const sorted = [...cards].sort((a, b) => a.dueAt - b.dueAt);

  // Then, fix any spacing violations by swapping with nearby cards
  const result = [...sorted];
  let iterations = 0;
  const maxIterations = result.length * 3;

  while (iterations < maxIterations) {
    const violation = findSpacingViolation(result);
    if (!violation) break;

    iterations++;
    const [i, j] = violation;

    // Try to find a swap candidate for the second card (j)
    // Look ahead to find a card with different translation_id that won't create new violations
    let swapped = false;
    const searchRange = Math.max(10, MIN_CARD_SPACING * 2);

    for (let k = j + 1; k < Math.min(j + searchRange, result.length); k++) {
      if (result[k].translationId !== result[i].translationId) {
        // Check if swapping j and k would create new violations
        if (!wouldSwapCreateViolation(result, j, k)) {
          // Check if swapping maintains reasonable urgency order
          const urgencyDiff = Math.abs(result[k].dueAt - result[j].dueAt);
          if (urgencyDiff < 60 * 60 * 1000) {
            [result[j], result[k]] = [result[k], result[j]];
            swapped = true;
            break;
          }
        }
      }
    }

    // If we couldn't find a good swap forward, try looking backward from i
    if (!swapped && i > 0) {
      for (let k = i - 1; k >= Math.max(0, i - searchRange); k--) {
        if (result[k].translationId !== result[i].translationId) {
          // Check if swapping i and k would create new violations
          if (!wouldSwapCreateViolation(result, i, k)) {
            const urgencyDiff = Math.abs(result[k].dueAt - result[i].dueAt);
            if (urgencyDiff < 60 * 60 * 1000) {
              [result[i], result[k]] = [result[k], result[i]];
              swapped = true;
              break;
            }
          }
        }
      }
    }

    // If still no swap found, try swapping j forward without the violation check
    // (as a fallback to make progress even if it creates a new violation elsewhere)
    if (!swapped) {
      for (let k = j + 1; k < Math.min(j + searchRange, result.length); k++) {
        if (result[k].translationId !== result[i].translationId) {
          const urgencyDiff = Math.abs(result[k].dueAt - result[j].dueAt);
          if (urgencyDiff < 60 * 60 * 1000) {
            [result[j], result[k]] = [result[k], result[j]];
            break;
          }
        }
      }
    }
  }

  return result;
};

export const countCardsStillDueToday = async (
  db: Database,
  { cardIds, tomorrowStartMs }: { cardIds: string[]; tomorrowStartMs: number }
): Promise<number> => {
  if (cardIds.length === 0) return 0;
  const cardCollection = db.collections.get<SrsCard>(SRS_CARD_TABLE);
  return cardCollection
    .query(Q.where('id', Q.oneOf(cardIds)), Q.where('due_at', Q.lt(tomorrowStartMs)))
    .fetchCount();
};
