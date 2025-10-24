import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

import { TRANSLATION_TABLE } from '../schema';

export default class Translation extends Model {
  static table = TRANSLATION_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('lesson_id') lessonId!: string | null;
  @field('phrase_primary_id') phrasePrimaryId!: string;
  @field('phrase_secondary_id') phraseSecondaryId!: string;
}
