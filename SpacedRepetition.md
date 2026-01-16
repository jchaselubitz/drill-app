# Spaced Repetition Architecture

This document describes the translation-based spaced repetition system, its data model, and study flow.

## Overview

- The SRS system is translation-pair based. Each `translation` row (a phrase pair) produces two cards:
  - `primary_to_secondary`
  - `secondary_to_primary`
- Cards store only scheduling state and foreign keys. The displayed text is pulled live from `phrase` rows.
- A deck contains translation pairs. Cards are scoped to a single deck.

## Data Model (WatermelonDB)

### Tables

- `deck`
  - Stores user-created decks and a default deck.
- `deck_translation`
  - Join table linking `deck` and `translation`.
- `srs_card`
  - Scheduling state for each direction of a translation pair.
- `srs_review_log`
  - Append-only review history for analytics and future FSRS upgrades.

### Key Fields

- `srs_card`
  - `deck_id`, `translation_id`, `direction`
  - `state` (`new`, `learning`, `review`, `relearning`)
  - `due_at`, `interval_days`, `ease`, `reps`, `lapses`, `step_index`
  - `stability`, `difficulty` (nullable; reserved for future FSRS)
- `srs_review_log`
  - `srs_card_id`, `deck_id`, `translation_id`, `direction`
  - `reviewed_at`, `rating` (`failed`, `hard`, `good`, `easy`)
  - before/after snapshots: `state_*`, `interval_*`, `ease_*`, `due_*`

## Scheduling

- Scheduling is SM-2 inspired with learning steps:
  - new steps: `10m`, `1d`
  - relearn steps: `10m`
- Ratings (`failed`, `hard`, `good`, `easy`) update state, interval, and ease.
- The next due time is stored as a timestamp to support intra-day learning steps.
- Review history is logged for each rating event.

## Daily Limits and Rollover

- Daily limits are per-deck:
  - `maxNewPerDay`
  - `maxReviewsPerDay`
- Day rollover is computed with a configurable `dayStartHour` (default: 4am).
- Counts are derived from `srs_review_log` using the day start boundary.

## Study Queue

- The queue is built per deck:
  1. Due reviews (`learning`, `review`, `relearning`) up to `maxReviewsPerDay` remaining.
  2. Due new cards up to `maxNewPerDay` remaining.
- Ordering:
  - reviews by `due_at` ascending
  - new by `created_at` ascending

## UI Flow

- Review tab:
  - Deck picker, daily counts, and Start Review.
- Review session:
  - Prompt (front), reveal (back), rate with 4 buttons.
- Deck management:
  - Create/select decks, set active deck.
- Phrase detail:
  - Each translation pair can be assigned to a deck, which creates/updates its two cards.

## Key Files

- Schema/migrations: `database/schema.ts`, `database/migrations.ts`
- Models: `database/models/Deck.ts`, `database/models/DeckTranslation.ts`, `database/models/SrsCard.ts`, `database/models/SrsReviewLog.ts`
- Scheduler/queue: `lib/srs/sm2.ts`, `lib/srs/queue.ts`, `lib/srs/time.ts`
- Screens: `features/review/screens/ReviewHomeScreen.tsx`, `features/review/screens/ReviewSessionScreen.tsx`, `features/review/screens/DecksScreen.tsx`
- Phrase integration: `features/phrase/screens/PhraseDetailScreen.tsx`

## Future Extensions

- FSRS scheduling: use `srs_review_log` plus `stability`/`difficulty` fields to migrate.
- Multi-deck assignment per translation (optional).
- Additional card templates (cloze, hints, or extra metadata on cards).
