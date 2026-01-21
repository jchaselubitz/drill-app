import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 4,
      steps: [
        createTable({
          name: 'skill',
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
    },
    {
      toVersion: 5,
      steps: [
        addColumns({
          table: 'phrase',
          columns: [{ name: 'attempt_id', type: 'string', isOptional: true }],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        createTable({
          name: 'deck',
          columns: [
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'name', type: 'string' },
            { name: 'archived', type: 'boolean' },
            { name: 'sort_order', type: 'number', isOptional: true },
            { name: 'is_default', type: 'boolean' },
          ],
        }),
        createTable({
          name: 'deck_translation',
          columns: [
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
            { name: 'deck_id', type: 'string' },
            { name: 'translation_id', type: 'string' },
          ],
        }),
        createTable({
          name: 'srs_card',
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
        createTable({
          name: 'srs_review_log',
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
      ],
    },
    {
      toVersion: 7,
      steps: [
        addColumns({
          table: 'deck',
          columns: [
            { name: 'source', type: 'string' },
            { name: 'topic', type: 'string', isOptional: true },
            { name: 'primary_lang', type: 'string', isOptional: true },
            { name: 'secondary_lang', type: 'string', isOptional: true },
            { name: 'level', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 8,
      steps: [
        addColumns({
          table: 'attempt',
          columns: [
            { name: 'lesson_id', type: 'string' },
            { name: 'paragraph', type: 'string' },
            { name: 'status', type: 'string' },
            { name: 'level', type: 'string' },
            { name: 'correction', type: 'string', isOptional: true },
            { name: 'feedback', type: 'string', isOptional: true },
            { name: 'vocabulary', type: 'string', isOptional: true },
          ],
        }),
        addColumns({
          table: 'lesson',
          columns: [{ name: 'user_language', type: 'string' }],
        }),
        createTable({
          name: 'pending_request',
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
      ],
    },
    {
      toVersion: 9,
      steps: [
        createTable({
          name: 'pending_audio_request',
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
    },
    {
      toVersion: 10,
      steps: [
        addColumns({
          table: 'profile',
          columns: [{ name: 'study_language', type: 'string', isOptional: true }],
        }),
      ],
    },
  ],
});
