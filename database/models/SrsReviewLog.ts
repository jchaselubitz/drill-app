import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

import { SRS_REVIEW_LOG_TABLE } from '../schema';

export default class SrsReviewLog extends Model {
  static table = SRS_REVIEW_LOG_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('srs_card_id') srsCardId!: string;
  @field('deck_id') deckId!: string;
  @field('translation_id') translationId!: string;
  @field('direction') direction!: string;
  @field('reviewed_at') reviewedAt!: number;
  @field('rating') rating!: string;
  @field('state_before') stateBefore!: string;
  @field('state_after') stateAfter!: string;
  @field('interval_before') intervalBefore!: number | null;
  @field('interval_after') intervalAfter!: number | null;
  @field('ease_before') easeBefore!: number | null;
  @field('ease_after') easeAfter!: number | null;
  @field('due_before') dueBefore!: number | null;
  @field('due_after') dueAfter!: number | null;
}
