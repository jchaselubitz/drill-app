import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const PHRASE_TABLE = 'phrase';
export const MEDIA_TABLE = 'media';
export const PROFILE_TABLE = 'profile';
export const SUBJECT_TABLE = 'subject';
export const TAG_TABLE = 'tag';
export const TRANSLATION_TABLE = 'translation';
export const PHRASE_TAG_TABLE = 'phrase_tag';
export const LESSON_TABLE = 'lesson';
export const ATTEMPT_TABLE = 'attempt';
export const FEEDBACK_TABLE = 'feedback';
export const SKILL_TABLE = 'skill';
const schema = appSchema({
  version: 5,
  tables: [
    tableSchema({
      name: PHRASE_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'text', type: 'string' },
        { name: 'lang', type: 'string' },
        { name: 'source', type: 'string' },
        { name: 'part_speech', type: 'string', isOptional: true },
        { name: 'favorite', type: 'boolean' },
        { name: 'filename', type: 'string', isOptional: true },
        { name: 'type', type: 'string' },
        { name: 'note', type: 'string', isOptional: true },
        { name: 'difficulty', type: 'number', isOptional: true },
        { name: 'history_id', type: 'string', isOptional: true },
        { name: 'attempt_id', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: MEDIA_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'title', type: 'string', isOptional: true },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'media_url', type: 'string' },
        { name: 'website_url', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: PROFILE_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },

        { name: 'username', type: 'string', isOptional: true },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'user_language', type: 'string', isOptional: true },
        { name: 'pref_language', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: SUBJECT_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'name', type: 'string', isOptional: true },
        { name: 'level', type: 'string', isOptional: true },
        { name: 'lang', type: 'string' },
      ],
    }),
    tableSchema({
      name: TAG_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'label', type: 'string' },
      ],
    }),
    tableSchema({
      name: PHRASE_TAG_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'phrase_id', type: 'string' },
        { name: 'tag_id', type: 'string' },
      ],
    }),
    tableSchema({
      name: TRANSLATION_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'lesson_id', type: 'string', isOptional: true },
        { name: 'phrase_primary_id', type: 'string' },
        { name: 'phrase_secondary_id', type: 'string' },
      ],
    }),
    tableSchema({
      name: LESSON_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'topic', type: 'string' },
        { name: 'phrases', type: 'string', isOptional: true },
        { name: 'prompt', type: 'string' },
        { name: 'lang', type: 'string' },
        { name: 'level', type: 'string' },
      ],
    }),
    tableSchema({
      name: ATTEMPT_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'lesson_id', type: 'string' },
        { name: 'paragraph', type: 'string' },
        { name: 'correction', type: 'string' },
      ],
    }),
    tableSchema({
      name: FEEDBACK_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'attempt_id', type: 'string' },
        { name: 'point', type: 'string' },
        { name: 'explanation', type: 'string' },
        { name: 'negative', type: 'boolean' },
      ],
    }),
    tableSchema({
      name: SKILL_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'name', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'rank', type: 'number' },
        { name: 'description', type: 'string' },
        { name: 'last_seen_at', type: 'number' },
        { name: 'occurrence_count', type: 'number' },
        { name: 'status', type: 'string' },
        { name: 'lang', type: 'string' },
      ],
    }),
  ],
});

export default schema;
