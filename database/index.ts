import { Platform } from 'react-native';

import Database from '@nozbe/watermelondb/Database';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import { Media, Phrase, PhraseTag, Profile, Subject, Tag, Translation } from './models';
import schema from './schema';

const adapter = new SQLiteAdapter({
  schema,
  // dbName: 'drill_app',
  // migrations,
  jsi: Platform.OS === 'ios',
});

const database = new Database({
  adapter,
  modelClasses: [Phrase, Media, Profile, Subject, Tag, Translation, PhraseTag],
});

export default database;
export type DrillDatabase = typeof database;
export * from './models';
export { schema };
