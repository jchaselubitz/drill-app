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
    [currentIndex, sessionCards, hydrateCard, db]
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
    const { update, log } = scheduleSm2Review(
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
      rating,
      nowMs
    );

    // Update card in database
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

      await db.collections.get<SrsReviewLog>(SRS_REVIEW_LOG_TABLE).create((logEntry) => {
        logEntry.srsCardId = currentItem.card.id;
        logEntry.deckId = currentItem.card.deckId;
        logEntry.translationId = currentItem.card.translationId;
        logEntry.direction = currentItem.card.direction;
        logEntry.reviewedAt = nowMs;
        logEntry.rating = rating;
        logEntry.stateBefore = log.stateBefore;
        logEntry.stateAfter = log.stateAfter;
        logEntry.intervalBefore = log.intervalBefore;
        logEntry.intervalAfter = log.intervalAfter;
        logEntry.easeBefore = log.easeBefore;
        logEntry.easeAfter = log.easeAfter;
        logEntry.dueBefore = log.dueBefore;
        logEntry.dueAfter = log.dueAfter;
        logEntry.createdAt = nowMs;
        logEntry.updatedAt = nowMs;
      });
    });

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
    const cardWasCompleted = update.dueAt >= tomorrowStartMs;
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
          <Button text="Show Answer" onPress={() => setShowBack(true)} variant="secondary" />
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
});
