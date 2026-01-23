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

/**
 * Insert a card into a queue, maintaining urgency order (by due_at) while
 * ensuring no adjacent cards have the same translation_id.
 *
 * Strategy:
 * 1. Find the earliest position where the card's due_at fits
 * 2. If that position would create an adjacent pair, find the next valid position
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

  // Check if inserting at this position would create an adjacent pair
  const wouldCreatePair =
    (insertIndex > 0 && newQueue[insertIndex - 1]?.translationId === card.translationId) ||
    (insertIndex < newQueue.length && newQueue[insertIndex]?.translationId === card.translationId);

  if (!wouldCreatePair) {
    // Safe to insert at the ideal position
    newQueue.splice(insertIndex, 0, card);
    return newQueue;
  }

  // Find the next valid position that maintains urgency while avoiding pairs
  // We'll look for positions where neither neighbor has the same translation_id
  for (let i = insertIndex + 1; i <= newQueue.length; i++) {
    const prevCard = i > 0 ? newQueue[i - 1] : null;
    const nextCard = i < newQueue.length ? newQueue[i] : null;

    // Check if this position is valid (no adjacent pairs)
    const isValid =
      (!prevCard || prevCard.translationId !== card.translationId) &&
      (!nextCard || nextCard.translationId !== card.translationId);

    if (isValid) {
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
 * Sort cards by due_at while maintaining separation of opposite pairs.
 * This is used for the initial queue creation.
 */
export const sortCardsMaintainingSeparation = (cards: SrsCard[]): SrsCard[] => {
  if (cards.length <= 1) return cards;

  // First, sort by due_at
  const sorted = [...cards].sort((a, b) => a.dueAt - b.dueAt);

  // Then, fix any adjacent pairs by swapping with nearby cards
  const result = [...sorted];
  let changed = true;
  let iterations = 0;
  const maxIterations = result.length * 2;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    for (let i = 0; i < result.length - 1; i++) {
      if (result[i].translationId === result[i + 1].translationId) {
        // Try to find a swap candidate within a reasonable range
        // Look ahead up to 5 positions to find a card with different translation_id
        let swapped = false;
        for (let j = i + 2; j < Math.min(i + 7, result.length); j++) {
          if (result[j].translationId !== result[i].translationId) {
            // Check if swapping maintains reasonable urgency order
            // Allow swap if the due_at difference is small (within 1 hour)
            const urgencyDiff = Math.abs(result[j].dueAt - result[i + 1].dueAt);
            if (urgencyDiff < 60 * 60 * 1000) {
              [result[i + 1], result[j]] = [result[j], result[i + 1]];
              swapped = true;
              changed = true;
              break;
            }
          }
        }

        // If we couldn't find a good swap, try looking backward
        if (!swapped && i > 0) {
          for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
            if (result[j].translationId !== result[i].translationId) {
              const urgencyDiff = Math.abs(result[j].dueAt - result[i].dueAt);
              if (urgencyDiff < 60 * 60 * 1000) {
                [result[i], result[j]] = [result[j], result[i]];
                swapped = true;
                changed = true;
                break;
              }
            }
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
