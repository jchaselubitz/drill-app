import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';

import { SrsCard, SrsReviewLog } from '@/database/models';
import { SRS_CARD_TABLE, SRS_REVIEW_LOG_TABLE } from '@/database/schema';
import type { SrsCardState } from '@/types';

import { getStudyDayStart } from './time';

const REVIEW_STATES: SrsCardState[] = ['learning', 'review', 'relearning'];

// Fisher-Yates shuffle algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Shuffle cards ensuring that cards with the same translation_id are separated
// This prevents users from seeing opposite directions of the same translation pair consecutively
const shuffleCardsSeparatingOpposites = (cards: SrsCard[]): SrsCard[] => {
  if (cards.length <= 1) return cards;

  // First, do a random shuffle
  let shuffled = shuffleArray(cards);

  // Then, fix any adjacent cards with the same translation_id
  const maxAttempts = shuffled.length * 2; // Reasonable limit to avoid infinite loops
  let attempts = 0;

  while (attempts < maxAttempts) {
    let hasAdjacentPairs = false;

    // Check for adjacent cards with the same translation_id and fix them
    for (let i = 0; i < shuffled.length - 1; i++) {
      if (shuffled[i].translationId === shuffled[i + 1].translationId) {
        hasAdjacentPairs = true;

        // Find any card with a different translation_id to swap with
        for (let j = 0; j < shuffled.length; j++) {
          if (j !== i && j !== i + 1 && shuffled[j].translationId !== shuffled[i].translationId) {
            [shuffled[i + 1], shuffled[j]] = [shuffled[j], shuffled[i + 1]];
            break;
          }
        }
      }
    }

    // If no adjacent pairs found, we're done
    if (!hasAdjacentPairs) {
      break;
    }

    // If we still have adjacent pairs, reshuffle and try again
    shuffled = shuffleArray(cards);
    attempts++;
  }

  return shuffled;
};

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
  return shuffleCardsSeparatingOpposites(allCards);
};

export const getNextSessionCard = async (
  db: Database,
  cardIds: string[]
): Promise<SrsCard | null> => {
  if (cardIds.length === 0) return null;
  const cardCollection = db.collections.get<SrsCard>(SRS_CARD_TABLE);
  const cards = await cardCollection
    .query(Q.where('id', Q.oneOf(cardIds)), Q.sortBy('due_at', Q.asc), Q.take(1))
    .fetch();
  return cards.length > 0 ? cards[0] : null;
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
