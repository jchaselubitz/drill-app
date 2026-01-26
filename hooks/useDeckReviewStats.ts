import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useCallback, useEffect, useState } from 'react';

import { SrsCard } from '@/database/models';
import { SRS_CARD_TABLE, SRS_REVIEW_LOG_TABLE } from '@/database/schema';
import { getDailyLimitsRemaining } from '@/lib/srs/queue';

export type DeckReviewStatsOptions = {
  dayStartHour: number;
  maxNewPerDay: number;
  maxReviewsPerDay: number;
};

export type DeckReviewStatsResult = {
  dueReviews: number;
  dueNew: number;
  newRemaining: number;
  reviewsRemaining: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
};

export function useDeckReviewStats(
  deckId: string | undefined,
  options: DeckReviewStatsOptions
): DeckReviewStatsResult {
  const db = useDatabase();
  const [stats, setStats] = useState<Omit<DeckReviewStatsResult, 'refresh'>>({
    dueReviews: 0,
    dueNew: 0,
    newRemaining: 0,
    reviewsRemaining: 0,
    isLoading: true,
  });

  const loadStats = useCallback(async () => {
    if (!deckId) {
      setStats({
        dueReviews: 0,
        dueNew: 0,
        newRemaining: 0,
        reviewsRemaining: 0,
        isLoading: false,
      });
      return;
    }

    const now = new Date();
    const nowMs = now.getTime();

    const limits = await getDailyLimitsRemaining(db, {
      deckId,
      now,
      dayStartHour: options.dayStartHour,
      maxNewPerDay: options.maxNewPerDay,
      maxReviewsPerDay: options.maxReviewsPerDay,
    });

    const cardCollection = db.collections.get<SrsCard>(SRS_CARD_TABLE);

    const dueReviews = await cardCollection
      .query(
        Q.where('deck_id', deckId),
        Q.where('suspended', false),
        Q.where('state', Q.oneOf(['learning', 'review', 'relearning'])),
        Q.where('due_at', Q.lte(nowMs))
      )
      .fetchCount();

    const dueNew = await cardCollection
      .query(
        Q.where('deck_id', deckId),
        Q.where('suspended', false),
        Q.where('state', 'new'),
        Q.where('due_at', Q.lte(nowMs))
      )
      .fetchCount();

    setStats({
      dueReviews,
      dueNew,
      newRemaining: limits.newRemaining,
      reviewsRemaining: limits.reviewsRemaining,
      isLoading: false,
    });
  }, [db, deckId, options.dayStartHour, options.maxNewPerDay, options.maxReviewsPerDay]);

  useEffect(() => {
    if (!deckId) {
      setStats((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Initial load
    loadStats();

    // Subscribe to SRS card changes for this deck
    const cardSub = db.collections
      .get(SRS_CARD_TABLE)
      .query(Q.where('deck_id', deckId))
      .observe()
      .subscribe(() => {
        loadStats();
      });

    // Subscribe to review log changes (for daily limits updates after reviews)
    const logSub = db.collections
      .get(SRS_REVIEW_LOG_TABLE)
      .query(Q.where('deck_id', deckId))
      .observe()
      .subscribe(() => {
        loadStats();
      });

    return () => {
      cardSub.unsubscribe();
      logSub.unsubscribe();
    };
  }, [db, deckId, loadStats]);

  const refresh = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  return { ...stats, refresh };
}
