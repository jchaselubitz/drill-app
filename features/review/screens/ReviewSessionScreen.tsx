import { useDatabase } from '@nozbe/watermelondb/react';
import { useFocusEffect } from '@react-navigation/native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useSettings } from '@/contexts/SettingsContext';
import { Phrase, SrsCard, SrsReviewLog, Translation } from '@/database/models';
import {
  PHRASE_TABLE,
  SRS_CARD_TABLE,
  SRS_REVIEW_LOG_TABLE,
  TRANSLATION_TABLE,
} from '@/database/schema';
import { useAudioPlayback, useColors } from '@/hooks';
import {
  applyCardRescheduleToQueue,
  countCardsStillDueToday,
  getDailyLimitsRemaining,
  getNextDueCardIndex,
  getReviewQueue,
} from '@/lib/srs/queue';
import { formatInterval, getRatingPreviews, scheduleSm2Review } from '@/lib/srs/sm2';
import { getNextStudyDayStart } from '@/lib/srs/time';
import type { SrsCardState, SrsDirection, SrsRating } from '@/types';

import {
  RatingButtons,
  ReviewCard,
  ReviewEmptyState,
  ReviewLoadingState,
  ReviewNoDeckState,
  ReviewProgress,
} from '../components';

type ReviewItem = {
  card: SrsCard;
  translation: Translation;
  front: Phrase;
  back: Phrase;
};

type UndoState = {
  previousItem: ReviewItem;
  previousQueue: SrsCard[];
  previousIndex: number;
  reviewLogId: string;
  cardSnapshot: {
    state: SrsCardState;
    dueAt: number;
    intervalDays: number;
    ease: number;
    reps: number;
    lapses: number;
    stepIndex: number;
    lastReviewedAt: number | null;
  };
  wasCompleted: boolean;
};

export default function ReviewSessionScreen() {
  const colors = useColors();
  const db = useDatabase();
  const params = useLocalSearchParams<{ deckId?: string }>();
  const { settings } = useSettings();

  const deckId = useMemo(
    () => params.deckId ?? settings.activeDeckId ?? null,
    [params.deckId, settings.activeDeckId]
  );

  const { play, togglePlayPause, isPlayingFile } = useAudioPlayback();
  const lastAutoPlayKeyRef = useRef<string | null>(null);

  // Session state
  const [sessionCards, setSessionCards] = useState<SrsCard[]>([]);
  const [tomorrowStartMs, setTomorrowStartMs] = useState<number>(0);
  const [currentItem, setCurrentItem] = useState<ReviewItem | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // Session stats
  const [sessionStats, setSessionStats] = useState<{
    totalInSession: number;
    remainingToday: number;
  }>({ totalInSession: 0, remainingToday: 0 });
  // Track unique cards completed this session (scheduled for tomorrow or later)
  const [completedCardIds, setCompletedCardIds] = useState<Set<string>>(new Set());
  // Undo state - stores the previous state to allow undoing the last rating
  const [undoState, setUndoState] = useState<UndoState | null>(null);

  // Hydrate a card into a ReviewItem
  const hydrateCard = useCallback(
    async (card: SrsCard): Promise<ReviewItem | null> => {
      try {
        const translation = await db.collections
          .get<Translation>(TRANSLATION_TABLE)
          .find(card.translationId);
        const primary = await db.collections
          .get<Phrase>(PHRASE_TABLE)
          .find(translation.phrasePrimaryId);
        const secondary = await db.collections
          .get<Phrase>(PHRASE_TABLE)
          .find(translation.phraseSecondaryId);

        const direction = card.direction as SrsDirection;
        const front = direction === 'primary_to_secondary' ? primary : secondary;
        const back = direction === 'primary_to_secondary' ? secondary : primary;

        return { card, translation, front, back };
      } catch (error) {
        console.warn('Failed to hydrate review card:', error);
        return null;
      }
    },
    [db]
  );

  // Load the next card from the session
  // Finds the first card that's actually due (dueAt <= now) starting from startIndex.
  // If no due card is found forward, wraps around to search from the beginning.
  // If still no due cards but there are cards scheduled for later today, accelerates the earliest one.
  const loadNextCard = useCallback(
    async (queueOverride?: SrsCard[], indexOverride?: number) => {
      const queue = queueOverride ?? sessionCards;
      const startIndex = indexOverride ?? currentIndex;

      if (queue.length === 0) {
        setCurrentItem(null);
        return;
      }

      const nowMs = Date.now();
      let nextIndex = getNextDueCardIndex({
        queue,
        nowMs,
        startIndex,
      });

      // If no due card found forward and we didn't start at 0, wrap around to check earlier cards
      // (cards earlier in the queue may have become due after being rescheduled)
      if (nextIndex === null && startIndex > 0) {
        nextIndex = getNextDueCardIndex({
          queue,
          nowMs,
          startIndex: 0,
        });
      }

      // If still no due cards but there are cards scheduled for later today, accelerate the earliest one
      // This allows users to complete all cards for the day in one sitting
      if (nextIndex === null && queue.length > 0 && tomorrowStartMs > 0) {
        // Find the card with the earliest dueAt that is still due today
        let earliestIndex = -1;
        let earliestDueAt = Infinity;

        for (let i = 0; i < queue.length; i++) {
          const card = queue[i];
          if (card.dueAt < tomorrowStartMs && card.dueAt < earliestDueAt) {
            earliestDueAt = card.dueAt;
            earliestIndex = i;
          }
        }

        if (earliestIndex !== -1) {
          nextIndex = earliestIndex;
        }
      }

      if (nextIndex === null) {
        // No due cards anywhere in the queue
        setCurrentItem(null);
        return;
      }

      // Re-fetch the card from the database to ensure fresh scheduling data
      const staleCard = queue[nextIndex];
      const freshCard = await db.collections.get<SrsCard>(SRS_CARD_TABLE).find(staleCard.id);
      const item = await hydrateCard(freshCard);

      if (item === null) {
        // Hydration failed - remove this card from queue and try next
        const filteredQueue = queue.filter((_, i) => i !== nextIndex);
        setSessionCards(filteredQueue);
        // Continue searching from same index (next card shifted into this position)
        await loadNextCard(filteredQueue, nextIndex);
        return;
      }

      setCurrentItem(item);
      setShowBack(false);
      setCurrentIndex(nextIndex);
    },
    [currentIndex, sessionCards, hydrateCard, db, tomorrowStartMs]
  );

  // Initialize the session (runs once)
  const initializeSession = useCallback(async () => {
    if (!deckId) return;
    setIsLoading(true);

    const now = new Date();

    // Calculate tomorrow's start time (session completion threshold)
    const tomorrowStart = getNextStudyDayStart(now, settings.dayStartHour);
    setTomorrowStartMs(tomorrowStart.getTime());

    // Get daily limits for initial deck building
    const limits = await getDailyLimitsRemaining(db, {
      deckId,
      now,
      dayStartHour: settings.dayStartHour,
      maxNewPerDay: settings.maxNewPerDay,
      maxReviewsPerDay: settings.maxReviewsPerDay,
    });

    // Fetch initial cards (daily limits apply here only)
    const cards = await getReviewQueue(db, {
      deckId,
      nowMs: now.getTime(),
      reviewsRemaining: limits.reviewsRemaining,
      newRemaining: limits.newRemaining,
    });

    // Store cards and IDs for session tracking
    setSessionCards(cards);
    const cardIds = cards.map((c) => c.id);

    // Calculate initial stats
    const remainingToday = await countCardsStillDueToday(db, {
      cardIds,
      tomorrowStartMs: tomorrowStart.getTime(),
    });

    setSessionStats({
      totalInSession: cardIds.length,
      remainingToday,
    });
    setCompletedCardIds(new Set());

    // Load first card
    if (cards.length > 0) {
      const firstCard = cards[0];
      const item = await hydrateCard(firstCard);
      setCurrentItem(item);
      setCurrentIndex(0);
    }

    setSessionInitialized(true);
    setIsLoading(false);
  }, [
    db,
    deckId,
    settings.dayStartHour,
    settings.maxNewPerDay,
    settings.maxReviewsPerDay,
    hydrateCard,
  ]);

  // Initialize session on mount
  useEffect(() => {
    if (!sessionInitialized) {
      initializeSession();
    }
  }, [initializeSession, sessionInitialized]);

  // Auto-play audio
  useEffect(() => {
    if (!settings.autoPlayReviewAudio || !currentItem) return;
    const filename = showBack ? currentItem.back.filename : currentItem.front.filename;
    const autoPlayKey = `${currentItem.card.id}-${showBack ? 'back' : 'front'}`;
    if (lastAutoPlayKeyRef.current === autoPlayKey) return;
    lastAutoPlayKeyRef.current = autoPlayKey;
    if (filename) {
      play(filename);
    }
  }, [currentItem, showBack, settings.autoPlayReviewAudio, play]);

  // Reset session when screen loses focus so a fresh session starts on return
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Cleanup on blur - reset session state
        setSessionInitialized(false);
        setSessionCards([]);
        setCurrentItem(null);
        setCurrentIndex(0);
        setShowBack(false);
        setSessionStats({ totalInSession: 0, remainingToday: 0 });
        setCompletedCardIds(new Set());
        setUndoState(null);
        lastAutoPlayKeyRef.current = null;
      };
    }, [])
  );

  const ratingIntervals = useMemo(() => {
    if (!currentItem || !showBack) return undefined;

    const previews = getRatingPreviews(
      {
        state: currentItem.card.state as SrsCardState,
        dueAt: currentItem.card.dueAt,
        intervalDays: currentItem.card.intervalDays,
        ease: currentItem.card.ease,
        reps: currentItem.card.reps,
        lapses: currentItem.card.lapses,
        stepIndex: currentItem.card.stepIndex,
        lastReviewedAt: currentItem.card.lastReviewedAt,
      },
      Date.now()
    );

    return {
      failed: formatInterval(previews[0].intervalMs),
      hard: formatInterval(previews[1].intervalMs),
      good: formatInterval(previews[2].intervalMs),
      easy: formatInterval(previews[3].intervalMs),
    };
  }, [currentItem, showBack]);

  const handleRate = async (rating: SrsRating) => {
    if (!currentItem || !deckId) return;
    const nowMs = Date.now();

    // Capture card state before update for undo
    const cardSnapshot = {
      state: currentItem.card.state as SrsCardState,
      dueAt: currentItem.card.dueAt,
      intervalDays: currentItem.card.intervalDays,
      ease: currentItem.card.ease,
      reps: currentItem.card.reps,
      lapses: currentItem.card.lapses,
      stepIndex: currentItem.card.stepIndex,
      lastReviewedAt: currentItem.card.lastReviewedAt,
    };

    const { update, log } = scheduleSm2Review(cardSnapshot, rating, nowMs);

    // Update card in database and create review log
    let reviewLogId = '';
    await db.write(async () => {
      await currentItem.card.update((card) => {
        card.state = update.state;
        card.dueAt = update.dueAt;
        card.intervalDays = update.intervalDays;
        card.ease = update.ease;
        card.reps = update.reps;
        card.lapses = update.lapses;
        card.stepIndex = update.stepIndex;
        card.lastReviewedAt = update.lastReviewedAt;
        card.updatedAt = nowMs;
      });

      const logEntry = await db.collections
        .get<SrsReviewLog>(SRS_REVIEW_LOG_TABLE)
        .create((entry) => {
          entry.srsCardId = currentItem.card.id;
          entry.deckId = currentItem.card.deckId;
          entry.translationId = currentItem.card.translationId;
          entry.direction = currentItem.card.direction;
          entry.reviewedAt = nowMs;
          entry.rating = rating;
          entry.stateBefore = log.stateBefore;
          entry.stateAfter = log.stateAfter;
          entry.intervalBefore = log.intervalBefore;
          entry.intervalAfter = log.intervalAfter;
          entry.easeBefore = log.easeBefore;
          entry.easeAfter = log.easeAfter;
          entry.dueBefore = log.dueBefore;
          entry.dueAfter = log.dueAfter;
          entry.createdAt = nowMs;
          entry.updatedAt = nowMs;
        });
      reviewLogId = logEntry.id;
    });

    // Store undo state before updating queue
    const previousQueue = [...sessionCards];
    const previousIndex = currentIndex;
    const cardWasCompleted = update.dueAt >= tomorrowStartMs;

    // Refresh card if it's still due today so the queue logic can work with latest values
    const refreshedCard =
      update.dueAt < tomorrowStartMs
        ? await db.collections.get<SrsCard>(SRS_CARD_TABLE).find(currentItem.card.id)
        : null;

    // Let the queue helper handle removal / optional reinsertion and next start index
    const { queue: newQueue, nextStartIndex } = applyCardRescheduleToQueue({
      queue: sessionCards,
      currentCardId: currentItem.card.id,
      refreshedCard,
      tomorrowStartMs,
      currentIndex,
    });

    // Save undo state
    setUndoState({
      previousItem: currentItem,
      previousQueue,
      previousIndex,
      reviewLogId,
      cardSnapshot,
      wasCompleted: cardWasCompleted,
    });

    setSessionCards(newQueue);

    // Check if session is complete (all cards scheduled for tomorrow or later)
    const remainingToday = await countCardsStillDueToday(db, {
      cardIds: newQueue.map((c) => c.id),
      tomorrowStartMs,
    });

    // Update session stats
    setSessionStats((prev) => ({
      ...prev,
      remainingToday,
    }));

    // Track unique completed cards (cards scheduled for tomorrow or later)
    if (cardWasCompleted) {
      setCompletedCardIds((prev) => new Set(prev).add(currentItem.card.id));
    }

    if (remainingToday === 0) {
      // Session complete - all cards scheduled for tomorrow or later
      setCurrentItem(null);
      return;
    }

    // Load next card using the updated queue
    await loadNextCard(newQueue, nextStartIndex);
  };

  const handleUndo = async () => {
    if (!undoState) return;

    const { previousItem, previousQueue, previousIndex, reviewLogId, cardSnapshot, wasCompleted } =
      undoState;

    // Revert card state and delete review log in database
    await db.write(async () => {
      // Restore card to previous state
      const card = await db.collections.get<SrsCard>(SRS_CARD_TABLE).find(previousItem.card.id);
      await card.update((c) => {
        c.state = cardSnapshot.state;
        c.dueAt = cardSnapshot.dueAt;
        c.intervalDays = cardSnapshot.intervalDays;
        c.ease = cardSnapshot.ease;
        c.reps = cardSnapshot.reps;
        c.lapses = cardSnapshot.lapses;
        c.stepIndex = cardSnapshot.stepIndex;
        c.lastReviewedAt = cardSnapshot.lastReviewedAt;
        c.updatedAt = Date.now();
      });

      // Delete the review log entry
      const logEntry = await db.collections
        .get<SrsReviewLog>(SRS_REVIEW_LOG_TABLE)
        .find(reviewLogId);
      await logEntry.destroyPermanently();
    });

    // Restore queue and current item
    setSessionCards(previousQueue);
    setCurrentIndex(previousIndex);

    // Re-hydrate the card with fresh data
    const freshCard = await db.collections.get<SrsCard>(SRS_CARD_TABLE).find(previousItem.card.id);
    const rehydratedItem = await hydrateCard(freshCard);
    setCurrentItem(rehydratedItem);
    setShowBack(true); // Show back since user was rating

    // Remove from completed if it was marked completed
    if (wasCompleted) {
      setCompletedCardIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(previousItem.card.id);
        return newSet;
      });
    }

    // Update remaining count
    const remainingToday = await countCardsStillDueToday(db, {
      cardIds: previousQueue.map((c) => c.id),
      tomorrowStartMs,
    });
    setSessionStats((prev) => ({
      ...prev,
      remainingToday,
    }));

    // Clear undo state (only one level of undo)
    setUndoState(null);
  };

  if (!deckId) {
    return <ReviewNoDeckState />;
  }

  if (isLoading) {
    return <ReviewLoadingState />;
  }

  if (!currentItem) {
    return <ReviewEmptyState />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Review',
          headerShown: true,
          headerBackTitle: 'Decks',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />
      <View style={styles.content}>
        <ReviewProgress
          totalInSession={sessionStats.totalInSession}
          remainingToday={sessionStats.remainingToday}
          completedThisSession={completedCardIds.size}
        />
        <ReviewCard
          front={currentItem.front}
          back={currentItem.back}
          showBack={showBack}
          onTogglePlayPause={togglePlayPause}
          isPlayingFile={isPlayingFile}
        />

        {!showBack ? (
          <View style={styles.buttonRow}>
            <Button
              text="Undo"
              onPress={handleUndo}
              variant="secondary"
              buttonState={undoState ? 'default' : 'disabled'}
              style={styles.undoButton}
            />
            <Button
              text="Show Answer"
              onPress={() => setShowBack(true)}
              variant="primary"
              style={styles.showAnswerButton}
            />
          </View>
        ) : (
          <RatingButtons onRate={handleRate} intervals={ratingIntervals} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    flex: 1,
    gap: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  undoButton: {
    width: 'auto',
  },
  showAnswerButton: {
    width: 'auto',
  },
});
