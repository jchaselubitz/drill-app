# Mock Database Blueprint

This document outlines the proposed Supabase schema for the Drill App. The schema focuses on keeping lessons, attempts, and personalized libraries separate while making it easy to derive metrics such as recent scores.

## Entity Relationship Overview

```
profiles ─┬─< lessons ─┬─< lesson_items ─┬─< attempts
          │            └─< lesson_item_focus (terms & concepts)
          └─< library_terms
          └─< library_concepts
```

### profiles
Stores Supabase-authenticated users.

| Column       | Type        | Notes                                   |
|--------------|-------------|-----------------------------------------|
| id           | uuid (PK)   | Matches `auth.users.id`.                |
| native_lang  | text        | Optional default native language.       |
| target_lang  | text        | Optional default study language.        |
| created_at   | timestamptz | Default `now()`.                        |

### lessons
Represents a single batch of generated content.

| Column        | Type        | Notes                                                   |
|---------------|-------------|---------------------------------------------------------|
| id            | uuid (PK)   | Generated client-side or via Supabase `uuid_generate_v4`.
| user_id       | uuid (FK)   | References `profiles.id`.                               |
| language      | text        | Target language.                                        |
| native_lang   | text        | User's native language.                                 |
| level         | text        | CEFR level string.                                      |
| topic         | text        | User supplied topic or focus phrase.                    |
| status        | text        | `draft` | `active` | `complete`.                        |
| created_at    | timestamptz | Default `now()`.                                        |
| completed_at  | timestamptz | Nullable.                                               |

### lesson_items
Individual prompts that make up a lesson.

| Column       | Type        | Notes                                 |
|--------------|-------------|---------------------------------------|
| id           | uuid (PK)   |                                       |
| lesson_id    | uuid (FK)   | References `lessons.id`.             |
| order_index  | integer     | 0-based order for the UI.            |
| prompt       | text        | Native-language prompt.              |
| answer       | text        | Ideal translation.                   |
| created_at   | timestamptz | Default `now()`.                      |

### lesson_item_focus
Flexible linking table that highlights words or concepts associated with a lesson item.

| Column       | Type        | Notes                                          |
|--------------|-------------|------------------------------------------------|
| id           | uuid (PK)   |                                                |
| item_id      | uuid (FK)   | References `lesson_items.id`.                  |
| focus_type   | text        | `term` or `concept`.                            |
| label        | text        | Word, phrase, or concept name.                 |
| weight       | numeric     | Optional frequency multiplier (default 1).     |

### attempts
Each user submission for a lesson item.

| Column          | Type        | Notes                                              |
|-----------------|-------------|----------------------------------------------------|
| id              | uuid (PK)   |                                                    |
| item_id         | uuid (FK)   | References `lesson_items.id`.                      |
| user_id         | uuid (FK)   | References `profiles.id`.                          |
| attempt_text    | text        | User-provided translation.                         |
| corrected_text  | text        | AI-adjusted correction.                            |
| spelling_score  | integer     | 0–100, returned by AI evaluation.                  |
| grammar_score   | integer     | 0–100, returned by AI evaluation.                  |
| rationale       | text        | Explanation from AI evaluation.                    |
| created_at      | timestamptz | Default `now()`.                                   |

### library_terms
Persistent word/phrase entries for spaced repetition.

| Column       | Type        | Notes                                            |
|--------------|-------------|--------------------------------------------------|
| id           | uuid (PK)   |                                                  |
| user_id      | uuid (FK)   | References `profiles.id`.                        |
| value        | text        | Word or phrase in target language.               |
| translation  | text        | Optional translation saved by the user.          |
| focus_level  | integer     | Multiplier for presentation frequency (1–5).     |
| source       | text        | `lesson`, `manual`, or `import`.                 |
| created_at   | timestamptz | Default `now()`.                                  |

### library_concepts
Grammar or usage concepts configured by the user.

| Column       | Type        | Notes                                            |
|--------------|-------------|--------------------------------------------------|
| id           | uuid (PK)   |                                                  |
| user_id      | uuid (FK)   | References `profiles.id`.                        |
| value        | text        | Concept label.                                   |
| focus_level  | integer     | Multiplier for future generation weighting.      |
| description  | text        | Optional explanation or rule summary.            |
| created_at   | timestamptz | Default `now()`.                                  |

### Mock Data Snapshot

The repository uses `src/lib/mockLessonGenerator.ts` to generate synthetic lessons. The mock output aligns with the schema above—each item includes IDs, prompts, answers, and focus metadata to mimic real responses from the Supabase edge functions.
