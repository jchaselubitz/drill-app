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
  - `maxNewPerDay` - Maximum number of cards in 'new' state that can be seen for the first time each day
  - `maxReviewsPerDay` - Maximum number of review sessions for cards in 'learning', 'review', or 'relearning' states each day
- Day rollover is computed with a configurable `dayStartHour` (default: 4am).
- Counts are derived from `srs_review_log` using the day start boundary:
  - New cards are counted by `state_before = 'new'` in the review log
  - Reviews are counted by `state_before != 'new'` in the review log
- **Important**: Daily limits are strictly enforced - once reached, no additional cards of that type will be shown until the next day

## Study Queue

The queue is built per deck following these rules:

1. **New cards**: Only shown if under the daily limit (`maxNewPerDay`)
   - Fetches cards in 'new' state that are due (`due_at <= now`)
   - Limited to `maxNewPerDay - newCardsReviewedToday`
   - Sorted by `created_at` ascending (oldest first)

2. **Review cards**: Only shows cards that are actually due
   - Fetches cards in 'learning', 'review', or 'relearning' states where `due_at <= now`
   - Limited to `maxReviewsPerDay - reviewsCompletedToday`
   - Sorted by `due_at` ascending (most overdue first)

3. **Queue behavior**:
   - New and review cards are combined and shuffled for variety
   - When the queue is exhausted, it will reload ONLY if:
     - There are new cards remaining under the daily limit, OR
     - There are review cards that are now due
   - If both limits are reached, the session ends

### Example Scenario

Assume a deck with:
- 44 cards in 'new' state
- Settings: `maxNewPerDay = 20`, `maxReviewsPerDay = 200`

**Day 1 (First Session)**:
- User sees 20 new cards (maxNewPerDay limit)
- Each card reviewed with 'good' transitions to 'learning' state with first step (10 minutes)
- Remaining 24 new cards are NOT shown - they wait for subsequent days
- Session ends or shows only due review cards

**Day 1 (10+ minutes later)**:
- The 20 'learning' cards are now due for their next review
- User sees those 20 cards again (as reviews, not new cards)
- After completing learning steps, cards graduate to 'review' state

**Day 2**:
- User sees 20 more new cards (next batch from the 24 remaining)
- Plus any cards from Day 1 that are due for review
- Pattern continues until all new cards have been introduced

**Day 3**:
- User sees final 4 new cards
- Plus any reviews that are scheduled for today
- No new cards remain after this

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
