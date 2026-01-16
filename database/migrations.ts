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
  ],
});
