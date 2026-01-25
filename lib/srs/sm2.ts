import type { SrsCardState, SrsRating } from '@/types';

import {
  SRS_DEFAULT_EASE,
  SRS_EASE_AGAIN,
  SRS_EASE_EASY,
  SRS_EASE_HARD,
  SRS_EASY_BONUS,
  SRS_EASY_INTERVAL_DAYS,
  SRS_GRADUATING_INTERVAL_DAYS,
  SRS_HARD_FACTOR,
  SRS_LAPSE_MULTIPLIER,
  SRS_MIN_EASE,
  SRS_NEW_FAILED_MS,
  SRS_NEW_GOOD_STEPS_MS,
  SRS_NEW_HARD_MS,
  SRS_RELEARN_STEPS_MS,
} from './constants';

export type SrsCardSnapshot = {
  state: SrsCardState;
  dueAt: number;
  intervalDays: number;
  ease: number;
  reps: number;
  lapses: number;
  stepIndex: number;
  lastReviewedAt: number | null;
};

export type SrsCardUpdate = Omit<SrsCardSnapshot, 'lastReviewedAt'> & {
  lastReviewedAt: number;
};

type Sm2Result = {
  update: SrsCardUpdate;
  log: {
    stateBefore: SrsCardState;
    stateAfter: SrsCardState;
    intervalBefore: number | null;
    intervalAfter: number | null;
    easeBefore: number | null;
    easeAfter: number | null;
    dueBefore: number | null;
    dueAfter: number | null;
  };
};

const clampEase = (ease: number): number => Math.max(SRS_MIN_EASE, ease);

const toMsFromDays = (days: number): number => days * 24 * 60 * 60 * 1000;

export const scheduleSm2Review = (
  card: SrsCardSnapshot,
  rating: SrsRating,
  nowMs: number
): Sm2Result => {
  const stateBefore = card.state;
  const intervalBefore = card.intervalDays;
  const easeBefore = card.ease;
  const dueBefore = card.dueAt;

  let state: SrsCardState = card.state;
  let intervalDays = card.intervalDays;
  let ease = card.ease || SRS_DEFAULT_EASE;
  let reps = card.reps;
  let lapses = card.lapses;
  let stepIndex = card.stepIndex;
  let dueAt = card.dueAt;

  if (state === 'new' || state === 'learning') {
    if (rating === 'failed') {
      // Failed: 1 minute, reset to step 0
      state = 'learning';
      stepIndex = 0;
      dueAt = nowMs + SRS_NEW_FAILED_MS;
    } else if (rating === 'hard') {
      // Hard: 5 minutes, stay at current step (doesn't advance)
      state = 'learning';
      dueAt = nowMs + SRS_NEW_HARD_MS;
    } else if (rating === 'good') {
      // Good: progress through steps, then graduate
      const goodSteps = SRS_NEW_GOOD_STEPS_MS;
      if (stepIndex >= goodSteps.length) {
        // Completed all good steps, graduate to review
        state = 'review';
        intervalDays = SRS_GRADUATING_INTERVAL_DAYS;
        stepIndex = 0;
        dueAt = nowMs + toMsFromDays(intervalDays);
      } else {
        // Use current step interval, then advance
        state = 'learning';
        dueAt = nowMs + goodSteps[stepIndex];
        stepIndex = stepIndex + 1;
      }
    } else {
      // Easy: immediately graduate to 4 days
      state = 'review';
      intervalDays = SRS_EASY_INTERVAL_DAYS;
      stepIndex = 0;
      dueAt = nowMs + toMsFromDays(intervalDays);
    }
  } else if (state === 'relearning') {
    const steps = SRS_RELEARN_STEPS_MS;
    if (rating === 'failed') {
      stepIndex = 0;
      dueAt = nowMs + steps[0];
    } else if (rating === 'hard') {
      dueAt = nowMs + (steps[stepIndex] ?? steps[0]);
    } else if (rating === 'good') {
      stepIndex = stepIndex + 1;
      if (stepIndex >= steps.length) {
        state = 'review';
        intervalDays = Math.max(1, intervalDays);
        stepIndex = 0;
        dueAt = nowMs + toMsFromDays(intervalDays);
      } else {
        dueAt = nowMs + steps[stepIndex];
      }
    } else {
      state = 'review';
      intervalDays = Math.max(1, intervalDays);
      stepIndex = 0;
      dueAt = nowMs + toMsFromDays(intervalDays);
    }
  } else {
    reps += 1;
    if (rating === 'failed') {
      lapses += 1;
      ease = clampEase(ease + SRS_EASE_AGAIN); // Anki: -0.20 ease penalty on lapse
      state = 'relearning';
      stepIndex = 0;
      intervalDays = Math.max(1, Math.round(intervalDays * SRS_LAPSE_MULTIPLIER)); // Anki default: reset to 1 day
      dueAt = nowMs + SRS_RELEARN_STEPS_MS[0];
    } else if (rating === 'hard') {
      ease = clampEase(ease + SRS_EASE_HARD);
      intervalDays = Math.max(1, Math.round(intervalDays * SRS_HARD_FACTOR));
      dueAt = nowMs + toMsFromDays(intervalDays);
    } else if (rating === 'good') {
      intervalDays = Math.max(1, Math.round(intervalDays * ease));
      dueAt = nowMs + toMsFromDays(intervalDays);
    } else {
      ease = clampEase(ease + SRS_EASE_EASY);
      intervalDays = Math.max(1, Math.round(intervalDays * ease * SRS_EASY_BONUS));
      dueAt = nowMs + toMsFromDays(intervalDays);
    }
  }

  return {
    update: {
      state,
      dueAt,
      intervalDays,
      ease,
      reps,
      lapses,
      stepIndex,
      lastReviewedAt: nowMs,
    },
    log: {
      stateBefore,
      stateAfter: state,
      intervalBefore: intervalBefore ?? null,
      intervalAfter: intervalDays ?? null,
      easeBefore: easeBefore ?? null,
      easeAfter: ease ?? null,
      dueBefore: dueBefore ?? null,
      dueAfter: dueAt ?? null,
    },
  };
};

export type RatingPreview = {
  rating: SrsRating;
  intervalMs: number;
};

/**
 * Calculate preview intervals for all rating options
 * Returns the time until next review for each rating
 */
export const getRatingPreviews = (card: SrsCardSnapshot, nowMs: number): RatingPreview[] => {
  const ratings: SrsRating[] = ['failed', 'hard', 'good', 'easy'];
  return ratings.map((rating) => {
    const result = scheduleSm2Review(card, rating, nowMs);
    const intervalMs = result.update.dueAt - nowMs;
    return { rating, intervalMs };
  });
};

/**
 * Format interval in milliseconds to human-readable string
 * Uses M for minutes, D for days
 */
export const formatInterval = (intervalMs: number): string => {
  const minutes = Math.round(intervalMs / (60 * 1000));
  const days = intervalMs / (24 * 60 * 60 * 1000);

  if (days >= 1) {
    return `${Math.round(days)}D`;
  }
  return `${minutes}M`;
};
