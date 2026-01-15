import { Model } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field } from '@nozbe/watermelondb/decorators';

import { TRANSLATION_TABLE } from '../schema';

export default class Translation extends Model {
  static table = TRANSLATION_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('lesson_id') lessonId!: string | null;
  @field('phrase_primary_id') phrasePrimaryId!: string;
  @field('phrase_secondary_id') phraseSecondaryId!: string;

  static async addTranslation(
    db: Database,
    {
      phrasePrimaryId,
      phraseSecondaryId,
      lessonId = null,
    }: {
      phrasePrimaryId: string;
      phraseSecondaryId: string;
      lessonId?: string | null;
    }
  ): Promise<Translation> {
    return await db.write(async () => {
      return await db.collections.get<Translation>(TRANSLATION_TABLE).create((translation) => {
        translation.phrasePrimaryId = phrasePrimaryId;
        translation.phraseSecondaryId = phraseSecondaryId;
        translation.lessonId = lessonId;
        translation.createdAt = Date.now();
        translation.updatedAt = Date.now();
      });
    });
  }
}
