import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import Database from '@nozbe/watermelondb/Database';
import { Platform } from 'react-native';

import migrations from './migrations';
import {
  Attempt,
  Deck,
  DeckTranslation,
  Feedback,
  Lesson,
  Media,
  Phrase,
  PhraseTag,
  Profile,
  Skill,
  SrsCard,
  SrsReviewLog,
  Subject,
  Tag,
  Translation,
} from './models';
import schema from './schema';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: Platform.OS === 'ios',
});

const database = new Database({
  adapter,
  modelClasses: [
    Attempt,
    Deck,
    DeckTranslation,
    Feedback,
    Lesson,
    Media,
    Phrase,
    PhraseTag,
    Profile,
    SrsCard,
    SrsReviewLog,
    Skill,
    Subject,
    Tag,
    Translation,
  ],
});

export default database;
export type DrillDatabase = typeof database;
export * from './models';
export { schema };
