import { Q } from '@nozbe/watermelondb';
import type Database from '@nozbe/watermelondb/Database';

import { SrsCard } from '@/database/models';
import { SRS_CARD_TABLE } from '@/database/schema';
import type { SrsDirection } from '@/types';

import { SRS_DEFAULT_EASE } from './constants';

const DIRECTIONS: SrsDirection[] = ['primary_to_secondary', 'secondary_to_primary'];

export const ensureSrsCardsForTranslation = async (
  db: Database,
  { deckId, translationId, nowMs }: { deckId: string; translationId: string; nowMs: number }
): Promise<SrsCard[]> => {
  const created: SrsCard[] = [];

  await db.write(async () => {
    for (const direction of DIRECTIONS) {
      const existing = await db.collections
        .get<SrsCard>(SRS_CARD_TABLE)
        .query(
          Q.where('deck_id', deckId),
          Q.where('translation_id', translationId),
          Q.where('direction', direction)
        )
        .fetch();

      if (existing.length > 0) {
        created.push(existing[0]);
        continue;
      }

      const newCard = await db.collections.get<SrsCard>(SRS_CARD_TABLE).create((card) => {
        card.deckId = deckId;
        card.translationId = translationId;
        card.direction = direction;
        card.state = 'new';
        card.dueAt = nowMs;
        card.intervalDays = 0;
        card.ease = SRS_DEFAULT_EASE;
        card.reps = 0;
        card.lapses = 0;
        card.stepIndex = 0;
        card.lastReviewedAt = null;
        card.suspended = false;
        card.stability = null;
        card.difficulty = null;
        card.createdAt = nowMs;
        card.updatedAt = nowMs;
      });

      created.push(newCard);
    }
  });

  return created;
};
