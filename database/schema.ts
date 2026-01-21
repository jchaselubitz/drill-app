import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const PHRASE_TABLE = 'phrase';
export const MEDIA_TABLE = 'media';
export const PROFILE_TABLE = 'profile';
export const SUBJECT_TABLE = 'subject';
export const TAG_TABLE = 'tag';
export const TRANSLATION_TABLE = 'translation';
export const DECK_TABLE = 'deck';
export const DECK_TRANSLATION_TABLE = 'deck_translation';
export const SRS_CARD_TABLE = 'srs_card';
export const SRS_REVIEW_LOG_TABLE = 'srs_review_log';
export const PHRASE_TAG_TABLE = 'phrase_tag';
export const LESSON_TABLE = 'lesson';
export const ATTEMPT_TABLE = 'attempt';
export const FEEDBACK_TABLE = 'feedback';
export const SKILL_TABLE = 'skill';
export const PENDING_REQUEST_TABLE = 'pending_request';
export const PENDING_AUDIO_REQUEST_TABLE = 'pending_audio_request';

const schema = appSchema({
  version: 10,
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
        { name: 'study_language', type: 'string', isOptional: true },
        { name: 'level', type: 'string', isOptional: true },
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
      name: DECK_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'name', type: 'string' },
        { name: 'archived', type: 'boolean' },
        { name: 'sort_order', type: 'number', isOptional: true },
        { name: 'is_default', type: 'boolean' },
        { name: 'source', type: 'string' },
        { name: 'topic', type: 'string', isOptional: true },
        { name: 'primary_lang', type: 'string', isOptional: true },
        { name: 'secondary_lang', type: 'string', isOptional: true },
        { name: 'level', type: 'string', isOptional: true },
        { name: 'max_new_per_day', type: 'number', isOptional: true },
        { name: 'max_reviews_per_day', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: DECK_TRANSLATION_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deck_id', type: 'string' },
        { name: 'translation_id', type: 'string' },
      ],
    }),
    tableSchema({
      name: SRS_CARD_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deck_id', type: 'string' },
        { name: 'translation_id', type: 'string' },
        { name: 'direction', type: 'string' },
        { name: 'state', type: 'string' },
        { name: 'due_at', type: 'number' },
        { name: 'interval_days', type: 'number' },
        { name: 'ease', type: 'number' },
        { name: 'reps', type: 'number' },
        { name: 'lapses', type: 'number' },
        { name: 'step_index', type: 'number' },
        { name: 'last_reviewed_at', type: 'number', isOptional: true },
        { name: 'suspended', type: 'boolean' },
        { name: 'stability', type: 'number', isOptional: true },
        { name: 'difficulty', type: 'number', isOptional: true },
      ],
    }),
    tableSchema({
      name: SRS_REVIEW_LOG_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'srs_card_id', type: 'string' },
        { name: 'deck_id', type: 'string' },
        { name: 'translation_id', type: 'string' },
        { name: 'direction', type: 'string' },
        { name: 'reviewed_at', type: 'number' },
        { name: 'rating', type: 'string' },
        { name: 'state_before', type: 'string' },
        { name: 'state_after', type: 'string' },
        { name: 'interval_before', type: 'number', isOptional: true },
        { name: 'interval_after', type: 'number', isOptional: true },
        { name: 'ease_before', type: 'number', isOptional: true },
        { name: 'ease_after', type: 'number', isOptional: true },
        { name: 'due_before', type: 'number', isOptional: true },
        { name: 'due_after', type: 'number', isOptional: true },
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
        { name: 'user_language', type: 'string' },
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
        { name: 'level', type: 'string' },
        { name: 'status', type: 'string' }, // 'pending' | 'completed' | 'failed'
        { name: 'correction', type: 'string', isOptional: true },
        { name: 'feedback', type: 'string', isOptional: true },
        { name: 'vocabulary', type: 'string', isOptional: true },
      ],
    }),
    tableSchema({
      name: PENDING_REQUEST_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'attempt_id', type: 'string' },
        { name: 'topic_language', type: 'string' },
        { name: 'user_language', type: 'string' },
        { name: 'level', type: 'string' },
        { name: 'retry_count', type: 'number' },
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
    tableSchema({
      name: PENDING_AUDIO_REQUEST_TABLE,
      columns: [
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'phrase_id', type: 'string' },
        { name: 'deck_id', type: 'string' },
        { name: 'language_code', type: 'string' },
        { name: 'status', type: 'string' },
        { name: 'retry_count', type: 'number' },
        { name: 'error_message', type: 'string', isOptional: true },
      ],
    }),
  ],
});

export default schema;
