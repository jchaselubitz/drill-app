# Engineering Plan: WatermelonDB Sync via Railway

## Overview

Add cross-device database sync to Drill App using WatermelonDB's built-in `synchronize()` protocol, backed by a self-hosted **Node.js + Postgres** server on [Railway](https://railway.com/). Includes email/password authentication with password reset.

---

## Architecture

```
┌──────────────────────────────────────────┐
│              Railway                     │
│                                          │
│  ┌──────────────┐   ┌────────────────┐   │
│  │  Node.js     │──▶│  PostgreSQL    │   │
│  │  (Express +  │   │  (user data +  │   │
│  │   sync API)  │   │   sync tables) │   │
│  └──────┬───────┘   └────────────────┘   │
│         │                                │
│  ┌──────┴───────┐                        │
│  │  S3-compat   │  (audio file storage)  │
│  │  or Railway  │                        │
│  │  Volume      │                        │
│  └──────────────┘                        │
│                                          │
└──────────────────────────────────────────┘
           ▲
           │ HTTPS
           │
    ┌──────┴──────┐     ┌──────────────┐
    │   iPhone    │     │    iPad      │
    │  (WmlDB)   │     │   (WmlDB)    │
    └─────────────┘     └──────────────┘
```

### Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Server | Node.js + Express (or Fastify) + TypeScript | Auth endpoints + sync endpoints |
| Database | PostgreSQL 16 | Mirrored WatermelonDB tables + auth tables |
| ORM/Query | Drizzle ORM (or Kysely) | Type-safe queries, migrations |
| Auth | bcrypt + JWT (access + refresh tokens) | Stateless auth with secure password hashing |
| Email | Resend (or Postmark) | Transactional email for password reset |
| File Storage | Railway Volume or Cloudflare R2 | Audio file sync |
| Hosting | Railway | Node.js service + Postgres addon |

---

## Part 1: Authentication

### 1.1 Security Best Practices

| Concern | Approach |
|---------|----------|
| Password hashing | **bcrypt** with cost factor 12 (adaptive, timing-safe) |
| Password requirements | Minimum 8 characters, checked against HaveIBeenPwned top 100k list |
| Token strategy | Short-lived **access token** (15 min) + long-lived **refresh token** (30 days, stored in DB, rotated on use) |
| Token storage (client) | `expo-secure-store` (Keychain on iOS, Keystore on Android) |
| Transport | HTTPS only (Railway provides TLS) |
| Rate limiting | `express-rate-limit` — 5 attempts/min on login, 3/hour on password reset |
| Password reset | Time-limited token (1 hour), single-use, sent via email |
| Email verification | Optional at signup, required before first sync |

### 1.2 Server-Side Auth Schema (Postgres)

```sql
CREATE TABLE auth_user (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE refresh_token (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,          -- SHA-256 hash of the token
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_refresh_token_user ON refresh_token(user_id);

CREATE TABLE password_reset_token (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,          -- SHA-256 hash of the token
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 Auth API Endpoints

```
POST /auth/register        { email, password }           → { accessToken, refreshToken }
POST /auth/login            { email, password }           → { accessToken, refreshToken }
POST /auth/refresh          { refreshToken }              → { accessToken, refreshToken }
POST /auth/logout           { refreshToken }              → 204
POST /auth/forgot-password  { email }                     → 200 (always, to prevent enumeration)
POST /auth/reset-password   { token, newPassword }        → 200
POST /auth/verify-email     { token }                     → 200
```

### 1.4 Password Reset Flow

```
1. User taps "Forgot Password" in app
2. App sends POST /auth/forgot-password { email }
3. Server always returns 200 (prevents email enumeration)
4. If email exists:
   a. Generate cryptographically random 32-byte token
   b. Store SHA-256 hash in password_reset_token (expires in 1 hour)
   c. Send email with deep link: drill://reset-password?token=<token>
      (with web fallback URL for universal links)
5. User taps link → app opens reset screen
6. App sends POST /auth/reset-password { token, newPassword }
7. Server verifies token hash, checks expiry/used, updates password_hash
8. Server revokes all existing refresh tokens for the user
9. User must log in again
```

### 1.5 Client-Side Auth Implementation

**New files needed in the app:**

```
lib/
  api/
    client.ts           -- Fetch wrapper with auth headers + token refresh
    auth.ts             -- Register, login, logout, forgot/reset password
    sync.ts             -- Pull/push sync calls
contexts/
  AuthContext.tsx        -- Auth state, token management, login/logout
features/
  auth/
    screens/
      LoginScreen.tsx
      RegisterScreen.tsx
      ForgotPasswordScreen.tsx
      ResetPasswordScreen.tsx
```

**AuthContext responsibilities:**
- Store access/refresh tokens in `expo-secure-store`
- Provide `isAuthenticated`, `user`, `login()`, `logout()`, `register()`
- Automatically refresh expired access tokens (intercept 401 responses)
- Clear tokens and redirect to login on refresh failure

**App layout change:**
```
RootLayout
├── AuthProvider           ← NEW
│   ├── If not authenticated → AuthStack (Login/Register/ForgotPassword)
│   └── If authenticated →
│       ├── DatabaseProvider
│       ├── SettingsProvider
│       ├── SyncProvider   ← NEW
│       └── AppContent (tabs)
```

---

## Part 2: WatermelonDB Sync

### 2.1 Sync Protocol Summary

WatermelonDB's `synchronize()` provides two callbacks:

- **`pullChanges({ lastPulledAt })`** — Client asks server: "What changed since timestamp X?"
  - Server returns `{ changes: { [table]: { created, updated, deleted } }, timestamp }`
- **`pushChanges({ changes, lastPulledAt })`** — Client sends local changes to server
  - Server applies them in a transaction, rejecting conflicts

WatermelonDB handles all client-side bookkeeping: tracking dirty records (`_status`, `_changed` columns), merging pulled changes with local modifications (per-column conflict resolution), and resetting sync status after successful push.

### 2.2 Server-Side Sync Schema (Postgres)

Every synced WatermelonDB table gets a mirrored Postgres table with extra columns:

```sql
-- Example for the "phrase" table (repeat pattern for all synced tables)
CREATE TABLE phrase (
  id              TEXT PRIMARY KEY,        -- WatermelonDB UUID
  user_id         UUID NOT NULL REFERENCES auth_user(id),

  -- All WatermelonDB columns --
  text            TEXT,
  lang            TEXT,
  source          TEXT,
  part_speech     TEXT,
  favorite        BOOLEAN DEFAULT FALSE,
  filename        TEXT,
  type            TEXT,
  note            TEXT,
  difficulty      REAL,
  history_id      TEXT,
  attempt_id      TEXT,

  -- Sync metadata --
  created_at      BIGINT NOT NULL,         -- Client timestamp (epoch ms)
  updated_at      BIGINT NOT NULL,         -- Client timestamp (epoch ms)
  last_modified_at TIMESTAMPTZ DEFAULT now(),  -- Server timestamp (for pull queries)
  deleted         BOOLEAN DEFAULT FALSE,       -- Soft delete (tombstone)

  UNIQUE(id, user_id)
);
CREATE INDEX idx_phrase_sync ON phrase(user_id, last_modified_at);
```

### 2.3 Tables to Sync vs. Skip

| Sync | Table | Notes |
|------|-------|-------|
| Yes | `profile` | One per user; merge carefully |
| Yes | `phrase` | Core vocabulary data |
| Yes | `translation` | Translation pairs |
| Yes | `lesson` | Writing prompts |
| Yes | `attempt` | User submissions |
| Yes | `feedback` | AI feedback on attempts |
| Yes | `skill` | Language skill tracking |
| Yes | `tag` | Organization labels |
| Yes | `phrase_tag` | Junction table |
| Yes | `subject` | Learning subjects |
| Yes | `media` | Media attachments |
| Yes | `deck` | Card collections |
| Yes | `deck_translation` | Deck-translation junction |
| Yes | `srs_card` | Spaced repetition state (see 2.5) |
| Yes | `srs_review_log` | Review history (append-only) |
| **No** | `pending_request` | Device-local retry queue |
| **No** | `pending_audio_request` | Device-local audio queue |

### 2.4 Sync Server Endpoints

```
POST /sync/pull    Authorization: Bearer <accessToken>
  Request:  { lastPulledAt: number | null, schemaVersion: number }
  Response: { changes: SyncChanges, timestamp: number }

POST /sync/push    Authorization: Bearer <accessToken>
  Request:  { changes: SyncChanges, lastPulledAt: number }
  Response: 200 | 409 (conflict → client must re-pull)
```

**Pull implementation (pseudocode):**

```typescript
async function pull(userId: string, lastPulledAt: number | null) {
  const serverNow = Date.now();
  const changes: Record<string, { created: any[]; updated: any[]; deleted: string[] }> = {};

  for (const table of SYNCED_TABLES) {
    if (lastPulledAt === null) {
      // First sync: everything is "created"
      const rows = await db.query(
        `SELECT * FROM ${table} WHERE user_id = $1 AND deleted = FALSE`, [userId]
      );
      changes[table] = { created: rows, updated: [], deleted: [] };
    } else {
      const cutoff = new Date(lastPulledAt).toISOString();

      const created = await db.query(
        `SELECT * FROM ${table}
         WHERE user_id = $1 AND last_modified_at > $2
         AND created_at > $3 AND deleted = FALSE`,
        [userId, cutoff, lastPulledAt]
      );
      const updated = await db.query(
        `SELECT * FROM ${table}
         WHERE user_id = $1 AND last_modified_at > $2
         AND created_at <= $3 AND deleted = FALSE`,
        [userId, cutoff, lastPulledAt]
      );
      const deleted = await db.query(
        `SELECT id FROM ${table}
         WHERE user_id = $1 AND last_modified_at > $2 AND deleted = TRUE`,
        [userId, cutoff]
      );
      changes[table] = {
        created: created,
        updated: updated,
        deleted: deleted.map(r => r.id),
      };
    }
  }
  return { changes, timestamp: serverNow };
}
```

**Push implementation (pseudocode):**

```typescript
async function push(userId: string, changes: SyncChanges, lastPulledAt: number) {
  await db.transaction(async (tx) => {
    for (const table of SYNCED_TABLES) {
      const { created, updated, deleted } = changes[table] || {};

      for (const record of created || []) {
        await tx.query(
          `INSERT INTO ${table} (id, user_id, ..., last_modified_at)
           VALUES ($1, $2, ..., now())
           ON CONFLICT (id, user_id) DO UPDATE SET ..., last_modified_at = now()`,
          [record.id, userId, ...]
        );
      }

      for (const record of updated || []) {
        // Conflict check: reject if server copy was modified after client's last pull
        const existing = await tx.query(
          `SELECT last_modified_at FROM ${table} WHERE id = $1 AND user_id = $2`,
          [record.id, userId]
        );
        if (existing && existing.last_modified_at > new Date(lastPulledAt)) {
          throw new ConflictError(); // 409 → client re-pulls
        }
        await tx.query(
          `UPDATE ${table} SET ..., last_modified_at = now()
           WHERE id = $1 AND user_id = $2`,
          [record.id, userId, ...]
        );
      }

      for (const id of deleted || []) {
        await tx.query(
          `UPDATE ${table} SET deleted = TRUE, last_modified_at = now()
           WHERE id = $1 AND user_id = $2`,
          [id, userId]
        );
      }
    }
  });
}
```

### 2.5 SRS Conflict Resolution Strategy

The `srs_card` table is conflict-sensitive. Two devices reviewing the same card offline produce divergent SM2 states (`ease`, `interval_days`, `reps`, `due_at`).

**Recommended approach: review-log-wins**

1. `srs_review_log` is append-only. Sync it as-is (no conflicts possible — each review gets a unique ID).
2. On pull, if an `srs_card` has conflicting state, the client detects the merge via WatermelonDB's per-column resolution.
3. After sync, run a local repair pass: recompute `srs_card` state by replaying all `srs_review_log` entries for that card in chronological order.
4. This guarantees both devices converge to the same SRS state regardless of sync order.

**Implementation:** Add a post-sync hook in the `synchronize()` call:

```typescript
await synchronize({
  database,
  pullChanges,
  pushChanges,
  onDidPullChanges: async ({ syncedTables }) => {
    if (syncedTables.includes('srs_review_log') || syncedTables.includes('srs_card')) {
      await recomputeSrsCardsFromLog(database);
    }
  },
});
```

### 2.6 Client-Side Sync Integration

```typescript
// lib/api/sync.ts
import { synchronize } from '@nozbe/watermelondb/sync';
import { database } from '@/database';
import { apiClient } from './client';

export async function syncDatabase() {
  await synchronize({
    database,
    sendCreatedAsUpdated: true,  // Simplifies server logic
    pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
      const response = await apiClient.post('/sync/pull', {
        lastPulledAt,
        schemaVersion,
        migration,
      });
      return response.data; // { changes, timestamp }
    },
    pushChanges: async ({ changes, lastPulledAt }) => {
      await apiClient.post('/sync/push', { changes, lastPulledAt });
    },
    migrationsEnabledAtVersion: 1,
  });
}
```

**Sync triggers:**
- On app foreground (AppState listener)
- After successful login
- Manual pull-to-refresh in settings
- After local write operations (debounced, 5-second delay)

---

## Part 3: Audio File Sync

### 3.1 Problem

The `Phrase` model stores audio as a local `filename` (e.g., `abc123.mp3`). The file lives on-device in Expo's `FileSystem.documentDirectory`. Other devices don't have it.

### 3.2 Approach

1. **Upload**: When a phrase gets a new audio file, upload it to server storage and store the remote URL.
2. **Download**: When pulling a phrase with a `filename` but no local file, download from the remote URL.
3. **Storage**: Use Cloudflare R2 (S3-compatible, generous free tier) or a Railway Volume.

### 3.3 Schema Change

Add an `audio_url` column to the `phrase` table (WatermelonDB schema v11):

```typescript
// Client-side migration
{ table: 'phrase', column: 'audio_url', type: 'string', isOptional: true }
```

Server-side `phrase` table already stores it as a column.

### 3.4 Sync Flow

```
Device A generates audio
  → Saves locally as abc123.mp3
  → Sets phrase.filename = 'abc123.mp3'
  → On next sync push, detects filename without audio_url
  → Uploads file to POST /files/audio { file, phraseId }
  → Server stores file, returns URL
  → Sets phrase.audio_url = 'https://..../abc123.mp3'
  → Push includes audio_url in phrase update

Device B pulls phrase
  → Sees audio_url but no local file
  → Downloads file to local FileSystem
  → Sets filename = 'abc123.mp3' locally
  → Audio plays from local cache
```

### 3.5 Server Endpoint

```
POST /files/audio    Authorization: Bearer <accessToken>
  Content-Type: multipart/form-data
  Body: { file, phraseId }
  Response: { url: string }

GET  /files/audio/:key   → Redirect to R2/signed URL
```

---

## Part 4: WatermelonDB Client-Side Changes

### 4.1 Schema Migration (v10 → v11)

```typescript
// database/migrations.ts — add to migrations array
{
  toVersion: 11,
  steps: [
    addColumns({
      table: 'phrase',
      columns: [
        { name: 'audio_url', type: 'string', isOptional: true },
      ],
    }),
  ],
},
```

No other schema changes needed. WatermelonDB already tracks `_status` and `_changed` internally for every record — these are used by `synchronize()` automatically.

### 4.2 Model Update

```typescript
// database/models/Phrase.ts — add field
@field('audio_url') audioUrl!: string | null;
```

### 4.3 Exclude Tables from Sync

WatermelonDB's `synchronize()` syncs all tables by default. Use the `pullChanges` response to only include synced tables (omit `pending_request` and `pending_audio_request`).

---

## Part 5: Server Project Structure

```
drill-sync-server/
├── src/
│   ├── index.ts                 -- Express app entry point
│   ├── config.ts                -- Environment variables
│   ├── middleware/
│   │   ├── auth.ts              -- JWT verification middleware
│   │   ├── rateLimit.ts         -- Rate limiting config
│   │   └── validate.ts          -- Request validation (zod)
│   ├── routes/
│   │   ├── auth.ts              -- Register, login, refresh, reset
│   │   └── sync.ts              -- Pull, push endpoints
│   ├── services/
│   │   ├── authService.ts       -- Password hashing, token generation
│   │   ├── syncService.ts       -- Pull/push logic
│   │   ├── emailService.ts      -- Password reset emails via Resend
│   │   └── fileService.ts       -- Audio upload/download
│   ├── db/
│   │   ├── client.ts            -- Postgres connection (pg or drizzle)
│   │   ├── schema.ts            -- Drizzle table definitions
│   │   └── migrations/          -- SQL migrations
│   └── types/
│       └── sync.ts              -- WatermelonDB sync types
├── drizzle.config.ts
├── package.json
├── tsconfig.json
├── Dockerfile                   -- For Railway deployment
└── railway.toml                 -- Railway config
```

### 5.1 Key Dependencies

```json
{
  "dependencies": {
    "express": "^5.1",
    "drizzle-orm": "^0.44",
    "pg": "^8.16",
    "bcrypt": "^6.0",
    "jsonwebtoken": "^9.0",
    "zod": "^3.25",
    "resend": "^4.0",
    "express-rate-limit": "^7.5",
    "helmet": "^8.1",
    "cors": "^2.8",
    "multer": "^2.0"
  }
}
```

---

## Part 6: Developer Setup Checklist

These are the manual steps you (the developer) must complete — they cannot be automated by code changes alone.

### 6.1 Railway Setup

- [ ] Create a Railway account at [railway.com](https://railway.com/)
- [ ] Create a new project
- [ ] Add a **PostgreSQL** service (one-click from Railway dashboard)
- [ ] Add a **Node.js** service (connect to your sync server repo)
- [ ] Set environment variables in Railway dashboard:
  ```
  DATABASE_URL=<provided by Railway Postgres>
  JWT_SECRET=<generate: openssl rand -base64 64>
  JWT_REFRESH_SECRET=<generate: openssl rand -base64 64>
  RESEND_API_KEY=<from resend.com>
  PASSWORD_RESET_URL=https://your-app-domain.com/reset-password
  CORS_ORIGIN=*   (tighten for production)
  ```
- [ ] Railway provides a public URL (e.g., `https://drill-sync.up.railway.app`)
- [ ] Enable auto-deploy from your sync server repo

### 6.2 Email Service (Password Reset)

- [ ] Sign up for [Resend](https://resend.com/) (free tier: 3,000 emails/month)
- [ ] Verify a sending domain (or use their sandbox for development)
- [ ] Get API key, add to Railway env vars
- [ ] Create email template for password reset

### 6.3 Audio File Storage

**Option A: Cloudflare R2** (recommended)
- [ ] Create Cloudflare account
- [ ] Create R2 bucket (free: 10GB storage, 10M reads/month)
- [ ] Generate R2 API credentials (S3-compatible)
- [ ] Add to Railway env vars:
  ```
  R2_ACCOUNT_ID=<cloudflare account id>
  R2_ACCESS_KEY_ID=<r2 access key>
  R2_SECRET_ACCESS_KEY=<r2 secret key>
  R2_BUCKET_NAME=drill-audio
  ```

**Option B: Railway Volume**
- [ ] Attach a volume to the Node.js service in Railway
- [ ] Mount at `/data/audio`
- [ ] Serve files via Express static middleware
- [ ] Simpler but less scalable; no CDN

### 6.4 Client App Configuration

- [ ] Add sync server URL to app environment:
  ```
  EXPO_PUBLIC_SYNC_SERVER_URL=https://drill-sync.up.railway.app
  ```
- [ ] Install `expo-secure-store` for token storage:
  ```
  npx expo install expo-secure-store
  ```
- [ ] The app already uses `expo-router`, so deep link handling for password reset can use Expo's URL scheme config in `app.config.ts`

### 6.5 Deep Link Setup (Password Reset)

- [ ] Configure a URL scheme in `app.config.ts`:
  ```typescript
  scheme: 'drill',
  ```
- [ ] Add universal link / associated domain for web fallback (optional but recommended)
- [ ] Password reset emails link to `drill://reset-password?token=<token>`

### 6.6 Database Provisioning

- [ ] Run migrations on Railway Postgres after first deploy:
  ```bash
  npx drizzle-kit push
  ```
- [ ] Verify tables created: `auth_user`, `refresh_token`, `password_reset_token`, + all 15 synced data tables

---

## Part 7: Implementation Order

### Phase 1: Sync Server Foundation

1. Initialize the `drill-sync-server` Node.js project with TypeScript
2. Set up Drizzle ORM with Postgres connection
3. Define server-side schema (auth tables + mirrored WatermelonDB tables)
4. Run initial migration
5. Deploy to Railway with Postgres

### Phase 2: Authentication

6. Implement register/login endpoints with bcrypt + JWT
7. Implement refresh token rotation
8. Implement password reset flow (token generation + email)
9. Add rate limiting and input validation
10. Test auth endpoints with curl/Postman

### Phase 3: Sync Endpoints

11. Implement `POST /sync/pull` with timestamp-based change detection
12. Implement `POST /sync/push` with conflict detection and transactional writes
13. Test with two simulated clients

### Phase 4: Client Auth Integration

14. Create `AuthContext` with `expo-secure-store` token management
15. Build Login, Register, ForgotPassword screens
16. Add API client with automatic token refresh on 401
17. Update `_layout.tsx` to gate app behind auth
18. Add WatermelonDB schema migration to v11 (`audio_url` column)

### Phase 5: Client Sync Integration

19. Add `synchronize()` call with pull/push against Railway server
20. Add sync triggers (app foreground, post-login, manual refresh)
21. Add sync status indicator in settings
22. Test end-to-end: create data on device A, sync, verify on device B

### Phase 6: Audio File Sync

23. Set up R2 bucket (or Railway Volume)
24. Add upload endpoint on server
25. Add client-side upload after audio generation
26. Add client-side download on pull when file is missing locally

### Phase 7: Polish

27. Add offline queue for failed syncs (retry on reconnect)
28. Add SRS card recomputation after sync (review-log-wins strategy)
29. Add sync conflict UI (notify user if conflicts occurred)
30. Tombstone cleanup: periodic job to hard-delete old soft-deleted records

---

## Cost Estimate

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Railway (Node.js + Postgres) | Trial credits | ~$5/month (Hobby) |
| Resend (email) | 3,000 emails/month | $20/month (50k emails) |
| Cloudflare R2 (audio storage) | 10GB + 10M reads/month | Pay-per-use beyond free tier |
| **Total** | **$0 during development** | **~$5-10/month in production** |

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| SRS state divergence after offline reviews on two devices | Incorrect review scheduling | Recompute SRS cards from merged review log (see 2.5) |
| Large audio file sync on cellular | High data usage, slow sync | Sync audio only on Wi-Fi (configurable), compress audio files |
| Railway downtime | App can't sync | App is offline-first — all features work locally; sync retries on reconnect |
| Token theft | Account compromise | Short-lived access tokens (15 min), refresh token rotation, HTTPS only |
| Email deliverability | Password reset emails land in spam | Use Resend with verified domain, proper SPF/DKIM |
| Schema drift between client and server | Sync failures | Version the sync protocol; `schemaVersion` param in pull lets server adapt |
| First sync with large existing dataset | Slow, potential timeout | Paginate first pull; batch inserts on client |
