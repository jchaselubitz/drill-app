import { Model } from '@nozbe/watermelondb';
import { field, writer } from '@nozbe/watermelondb/decorators';

import { SRS_CARD_TABLE } from '../schema';

export default class SrsCard extends Model {
  static table = SRS_CARD_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('deck_id') deckId!: string;
  @field('translation_id') translationId!: string;
  @field('direction') direction!: string;
  @field('state') state!: string;
  @field('due_at') dueAt!: number;
  @field('interval_days') intervalDays!: number;
  @field('ease') ease!: number;
  @field('reps') reps!: number;
  @field('lapses') lapses!: number;
  @field('step_index') stepIndex!: number;
  @field('last_reviewed_at') lastReviewedAt!: number | null;
  @field('suspended') suspended!: boolean;
  @field('stability') stability!: number | null;
  @field('difficulty') difficulty!: number | null;

  @writer async markSuspended(suspended: boolean): Promise<SrsCard> {
    return await this.update((card) => {
      card.suspended = suspended;
      card.updatedAt = Date.now();
    });
  }
}
