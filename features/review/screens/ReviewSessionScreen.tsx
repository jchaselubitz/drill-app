import { useDatabase } from '@nozbe/watermelondb/react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { useSettings } from '@/contexts/SettingsContext';
import { Phrase, SrsCard, SrsReviewLog, Translation } from '@/database/models';
import { PHRASE_TABLE, SRS_REVIEW_LOG_TABLE, TRANSLATION_TABLE } from '@/database/schema';
import { useAudioPlayback, useColors } from '@/hooks';
import { getDailyLimitsRemaining, getReviewQueue } from '@/lib/srs/queue';
import { formatInterval, getRatingPreviews, scheduleSm2Review } from '@/lib/srs/sm2';
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
  const [queue, setQueue] = useState<ReviewItem[]>([]);
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<{
    newRemaining: number;
    reviewsRemaining: number;
    newDone: number;
    reviewsDone: number;
  } | null>(null);

  const loadQueue = useCallback(async () => {
    if (!deckId) return;
    setIsLoading(true);
    const now = new Date();
    const limits = await getDailyLimitsRemaining(db, {
      deckId,
      now,
      dayStartHour: settings.dayStartHour,
      maxNewPerDay: settings.maxNewPerDay,
      maxReviewsPerDay: settings.maxReviewsPerDay,
    });

    setDailyStats(limits);

    const cards = await getReviewQueue(db, {
      deckId,
      nowMs: now.getTime(),
      reviewsRemaining: limits.reviewsRemaining,
      newRemaining: limits.newRemaining,
    });

    const items = await Promise.all(
      cards.map(async (card) => {
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
      })
    );

    setQueue(items.filter((item): item is ReviewItem => item !== null));
    setIndex(0);
    setShowBack(false);
    setIsLoading(false);
  }, [db, deckId, settings.dayStartHour, settings.maxNewPerDay, settings.maxReviewsPerDay]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const current = queue[index] ?? null;

  const ratingIntervals = useMemo(() => {
    if (!current || !showBack) return undefined;

    const previews = getRatingPreviews(
      {
        state: current.card.state as SrsCardState,
        dueAt: current.card.dueAt,
        intervalDays: current.card.intervalDays,
        ease: current.card.ease,
        reps: current.card.reps,
        lapses: current.card.lapses,
        stepIndex: current.card.stepIndex,
        lastReviewedAt: current.card.lastReviewedAt,
      },
      Date.now()
    );

    return {
      failed: formatInterval(previews[0].intervalMs),
      hard: formatInterval(previews[1].intervalMs),
      good: formatInterval(previews[2].intervalMs),
      easy: formatInterval(previews[3].intervalMs),
    };
  }, [current, showBack]);

  useEffect(() => {
    if (!settings.autoPlayReviewAudio || !current) return;
    const filename = showBack ? current.back.filename : current.front.filename;
    const autoPlayKey = `${current.card.id}-${showBack ? 'back' : 'front'}`;
    if (lastAutoPlayKeyRef.current === autoPlayKey) return;
    lastAutoPlayKeyRef.current = autoPlayKey;
    if (filename) {
      play(filename);
    }
  }, [current, showBack, settings.autoPlayReviewAudio, play]);

  const handleRate = async (rating: SrsRating) => {
    if (!current || !deckId) return;
    const nowMs = Date.now();
    const { update, log } = scheduleSm2Review(
      {
        state: current.card.state as SrsCardState,
        dueAt: current.card.dueAt,
        intervalDays: current.card.intervalDays,
        ease: current.card.ease,
        reps: current.card.reps,
        lapses: current.card.lapses,
        stepIndex: current.card.stepIndex,
        lastReviewedAt: current.card.lastReviewedAt,
      },
      rating,
      nowMs
    );

    await db.write(async () => {
      await current.card.update((card) => {
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
        logEntry.srsCardId = current.card.id;
        logEntry.deckId = current.card.deckId;
        logEntry.translationId = current.card.translationId;
        logEntry.direction = current.card.direction;
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

    // Refresh daily stats after rating
    const now = new Date();
    const limits = await getDailyLimitsRemaining(db, {
      deckId,
      now,
      dayStartHour: settings.dayStartHour,
      maxNewPerDay: settings.maxNewPerDay,
      maxReviewsPerDay: settings.maxReviewsPerDay,
    });
    setDailyStats(limits);

    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      await loadQueue();
      return;
    }

    setIndex(nextIndex);
    setShowBack(false);
  };

  if (!deckId) {
    return <ReviewNoDeckState />;
  }

  if (isLoading) {
    return <ReviewLoadingState />;
  }

  if (!current) {
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
        {dailyStats && (
          <ReviewProgress
            newRemaining={dailyStats.newRemaining}
            reviewsRemaining={dailyStats.reviewsRemaining}
            completedToday={dailyStats.newDone + dailyStats.reviewsDone}
          />
        )}
        <ReviewCard
          front={current.front}
          back={current.back}
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
