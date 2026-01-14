// app/model/migrations.js

import { createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    // {
    //   // ⚠️ Set this to a number one larger than the current schema version
    //   toVersion: 2,
    //   steps: [
    //     // See "Migrations API" for more details
    //     // createTable({
    //     //   name: 'comments',
    //     //   columns: [
    //     //     { name: 'post_id', type: 'string', isIndexed: true },
    //     //     { name: 'body', type: 'string' },
    //     //   ],
    //     // }),
    //   ],
    // },
  ],
});
