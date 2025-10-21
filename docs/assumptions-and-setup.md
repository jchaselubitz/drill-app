# Assumptions and local setup

## Assumptions
- **Primary platform**: iOS (iPhone) with Android parity as a stretch goal. Layout decisions prioritize
  a portrait experience and rely on Expo-managed workflow features.
- **Authentication**: Supabase Auth will handle email or social login. The app scaffolding expects a
  profile record (`profiles` table) that mirrors the auth user id.
- **AI providers**: The project will support OpenAI and Google Vertex AI. The current code contains
  placeholders in the Supabase Edge Functions where the actual API calls should be inserted.
- **State management**: Lightweight React Context providers (`LessonProvider`, `LibraryProvider`) are
  sufficient for the MVP. Consider replacing with Zustand or Redux Toolkit if requirements grow.
- **Offline mode**: Not in scope for the scaffold. Supabase sync or caching layers are not yet added.
- **Design system**: Tailwind or design tokens are not configured; styling uses inline styles with a
  neutral palette inspired by Tailwind Indigo/Slate.

## Prerequisites
- Node.js 18+ and npm or Yarn
- Expo CLI (`npm install -g expo-cli`) or `npx` for local commands
- Supabase CLI (`brew install supabase/tap/supabase` or follow Supabase docs)

## Getting started locally
1. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Configure environment variables**
   Create an `.env` file in the project root (Expo automatically reads `EXPO_PUBLIC_*`).
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=<your-project-url>
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
   ```

3. **Run the Expo app**
   ```bash
   npm run start
   ```
   This opens Expo Dev Tools in the browser. Use the iOS simulator, Android emulator, or Expo Go to
   load the app.

4. **Start Supabase locally (optional)**
   ```bash
   supabase start
   ```
   Update the environment variables to point to the local Supabase instance if desired. Seed the
   database using the schema in `docs/database-mock.md`.

5. **Deploy or emulate functions**
   With the Supabase CLI authenticated, deploy the scaffolded functions:
   ```bash
   supabase functions deploy generate-content
   supabase functions deploy lesson-feedback
   supabase functions deploy library-expansion
   ```
   When running locally, you can use `supabase functions serve generate-content` to test an individual
   function.

6. **Type checking and linting**
   ```bash
   npm run typecheck
   npm run lint
   ```

## Next steps
- Replace mock logic in Supabase functions with actual AI API calls and add input validation via Zod.
- Connect Supabase Auth and persist lessons to the real database.
- Build mutation hooks (React Query or TanStack Query) once network interactions are ready.
- Add instrumentation (Sentry, analytics) and automated tests for regression coverage.
