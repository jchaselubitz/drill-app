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
├── .mcp.json               # MCP server configuration
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout with providers
│   ├── (tabs)/             # Tab-based navigation group
│   │   ├── _layout.tsx     # Tab bar configuration (2 tabs)
│   │   ├── index.tsx       # Lessons tab (library + create modal)
│   │   └── settings.tsx    # Settings tab
│   ├── lesson/
│   │   └── [id].tsx        # Lesson detail screen (dynamic route)
│   └── +not-found.tsx      # 404 page
├── database/
│   ├── index.ts            # Database initialization
│   ├── schema.ts           # WatermelonDB schema definitions
│   └── models/             # Database model classes
│       ├── Phrase.ts       # Vocabulary phrases
│       ├── Media.ts        # Media attachments
│       ├── Profile.ts      # User profile
│       ├── Subject.ts      # Learning subjects
│       ├── Tag.ts          # Phrase tags
│       ├── PhraseTag.ts    # Phrase-tag junction
│       ├── Translation.ts  # Phrase translations
│       ├── Lesson.ts       # Writing lessons
│       └── Attempt.ts      # Lesson attempt history
├── lib/
│   ├── gemini.ts           # Gemini API client
│   └── ai/
│       ├── tutor.ts        # Tutor prompt generation
│       └── explain.ts      # Explanation generation
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── types/                  # TypeScript type definitions
├── constants/              # App constants and config
└── assets/                 # Images, fonts, etc.
```

## Key Features

### 1. Tutor Prompt Generation (`lib/ai/tutor.ts`)
Generates writing prompts tailored to user's language level (CEFR A1-C2).
- Adapts complexity based on level
- Incorporates related phrases for vocabulary practice
- Supports prompt length adjustment (shorter/longer)

### 2. Paragraph Review (`lib/ai/review.ts`)
Reviews user-written paragraphs and provides:
- Corrected version with markdown highlighting
- Bullet-point feedback on grammar/vocabulary
- Specific grammar rule explanations

### 3. Explanation Generation (`lib/ai/explain.ts`)
Provides contextual explanations for:
- Grammar concepts
- Vocabulary usage
- Cultural context

### 4. Lesson System (`app/lesson/[id].tsx`)
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

## MCP Servers

This project includes MCP (Model Context Protocol) server configuration in `.mcp.json`:

- **DeepWiki** - Provides documentation lookup for libraries and frameworks used in this project. Use it to look up Expo, React Native, WatermelonDB, and other dependency documentation.

## Skills

Project-specific patterns and learnings are documented in `.claude/skills/`:

- **[expo-router.md](.claude/skills/expo-router.md)** - Expo Router patterns including Stack configuration, native tabs, and file-based routing best practices
