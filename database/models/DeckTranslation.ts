import { Model } from '@nozbe/watermelondb';
import { field, writer } from '@nozbe/watermelondb/decorators';

import { DECK_TRANSLATION_TABLE } from '../schema';

export default class DeckTranslation extends Model {
  static table = DECK_TRANSLATION_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('deck_id') deckId!: string;
  @field('translation_id') translationId!: string;

  @writer async updateDeckId(deckId: string): Promise<DeckTranslation> {
    return await this.update((deckTranslation) => {
      deckTranslation.deckId = deckId;
      deckTranslation.updatedAt = Date.now();
    });
  }
}
