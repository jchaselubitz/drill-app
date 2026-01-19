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

  const newCards = await cardCollection
    .query(
      Q.where('deck_id', deckId),
      Q.where('suspended', false),
      Q.where('state', 'new'),
      Q.where('due_at', Q.lte(nowMs)),
      Q.sortBy('created_at', Q.asc),
      Q.take(newRemaining)
    )
    .fetch();

  const allCards = [...reviewCards, ...newCards];
  return shuffleArray(allCards);
};
