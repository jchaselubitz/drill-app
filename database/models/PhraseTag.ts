import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

import { PHRASE_TAG_TABLE } from '../schema';

import { Phrase, Tag } from '.';

export default class PhraseTag extends Model {
  static table = PHRASE_TAG_TABLE;
  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @relation('phrase', 'id')
  phrase!: Phrase;
  @relation('tag', 'id')
  tag!: Tag;
}
