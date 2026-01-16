# Drill App - Language Learning Mobile App

A React Native mobile app for language learning with AI-powered tutoring.

## Tech Stack

- **React Native** with Expo SDK 54
- **Expo Router** with native tabs (`expo-router/unstable-native-tabs`)
- **WatermelonDB** for local database with reactive queries
- **Google Gemini Flash** (gemini-3.0-flash) for AI features
- **Expo Vector Icons** for iconography
- **TypeScript** for type safety

## Project Structure

```
drill-app/
├── app/           # Expo Router routes (thin wrappers importing from features/)
├── features/      # Feature modules with screens/, components/, context/
├── database/      # WatermelonDB schema, migrations, and models/
├── lib/           # Gemini client and ai/ functions (tutor, explain, translate, analyzeSkills)
├── components/    # Shared UI components
├── contexts/      # React contexts
├── hooks/         # Custom hooks
├── types/         # TypeScript types
└── constants/     # App constants
```

## Key Features

### 1. Tutor Prompt Generation (`lib/ai/tutor.ts`)
Generates writing prompts tailored to user's language level (CEFR A1-C2).
- Adapts complexity based on level
- Incorporates related phrases for vocabulary practice
- Supports prompt length adjustment (shorter/longer)

### 2. Explanation Generation (`lib/ai/explain.ts`)
Provides contextual explanations for:
- Grammar concepts
- Vocabulary usage
- Cultural context

### 3. Translation (`lib/ai/translate.ts`)
Handles phrase translation with:
- Automatic language detection
- Bidirectional translation support

### 4. Skill Analysis (`lib/ai/analyzeSkills.ts`)
Analyzes user attempts to track language skills:
- Extracts skills demonstrated in writing
- Tracks progress over time

### 5. Lesson System (`features/lesson/screens/LessonDetailScreen.tsx`)
Structured writing practice with:
- Saved prompts with topic, level, and related phrases
- Attempt history with corrections and feedback
- Reactive data updates via WatermelonDB

## Environment Variables

```bash
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

## Commands

```bash
# Start development
yarn start:expo

# Run on iOS
yarn ios

# Run on Android
yarn android

# Run on web
yarn web

# Install dependencies
yarn install

# Reset project (clear caches)
yarn new
```

## CEFR Levels

- **A1** - Beginner
- **A2** - Elementary
- **B1** - Intermediate
- **B2** - Upper Intermediate
- **C1** - Advanced
- **C2** - Proficient

## Development Notes

- **Feature-based architecture**: Screens and their related components live in `features/` modules
- **Thin route files**: Files in `app/` are thin wrappers that import screens from `features/`
- Use `expo-router/unstable-native-tabs` for native tab bar with icons
- Gemini API calls go through `lib/gemini.ts` client
- All AI functions return typed responses
- Prefer functional components with hooks
- Use Expo Vector Icons (`@expo/vector-icons`) for all icons
- Database models extend WatermelonDB's `Model` class with decorators
- Use `useDatabase()` hook from `@nozbe/watermelondb/react` for queries
- Static model methods (e.g., `Lesson.addLesson()`) handle write operations

## API Response Formats

### Correction Structure
```typescript
{
  correction: string;  // Corrected text with markdown
  feedback: string;    // Bullet-point feedback
}
```

### Explanation Response
```typescript
{
  type: "message" | "translation" | "list";
  data: string;
}
```

## Database Models

Key models and their relationships:
- **Lesson** - Writing prompts with topic, level, language, and optional phrases
- **Attempt** - User submissions linked to lessons with AI-generated correction/feedback
- **Phrase** - Vocabulary items with language, source, part of speech, difficulty
- **Translation** - Links primary/secondary phrases for translation pairs
- **Tag/PhraseTag** - Tagging system for organizing phrases
- **Profile** - User settings (languages, preferences)
- **Subject** - Learning subjects with language and level
- **Media** - Media attachments with URLs and metadata
- **Skill** - Language skills tracked from user attempts
- **Feedback** - Feedback records for attempts

## MCP Servers

This project includes MCP (Model Context Protocol) server configuration in `.mcp.json`:

- **DeepWiki** - Provides documentation lookup for libraries and frameworks used in this project. Use it to look up Expo, React Native, WatermelonDB, and other dependency documentation.

## Skills

Project-specific patterns and learnings are documented in `.claude/skills/`:

- **[expo-router.md](.claude/skills/expo-router.md)** - Expo Router patterns including Stack configuration, native tabs, and file-based routing best practices
