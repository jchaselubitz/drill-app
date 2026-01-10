# Drill App - Language Learning Mobile App

A React Native mobile app for language learning with AI-powered tutoring.

## Tech Stack

- **React Native** with Expo SDK 54
- **Expo Router** with native tabs (`expo-router/unstable-native-tabs`)
- **Google Gemini Flash** (gemini-2.0-flash) for AI features
- **Expo Vector Icons** for iconography
- **TypeScript** for type safety

## Project Structure

```
drill-app/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout with native tabs
│   ├── (tabs)/             # Tab-based navigation group
│   │   ├── _layout.tsx     # Tab bar configuration
│   │   ├── index.tsx       # Practice tab (writing prompts)
│   │   ├── review.tsx      # Review tab (paragraph submission)
│   │   └── settings.tsx    # Settings tab
│   └── +not-found.tsx      # 404 page
├── lib/
│   ├── gemini.ts           # Gemini API client
│   └── ai/
│       ├── tutor.ts        # Tutor prompt generation
│       ├── review.ts       # Paragraph review
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

## Language Codes

Uses ISO 639-1 language codes:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese

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
