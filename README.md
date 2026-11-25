# Drill

A mobile language learning app with AI-powered tutoring and spaced repetition.

## What is Drill?

Drill helps you learn languages through writing practice and vocabulary review.
Write responses to AI-generated prompts tailored to your level, get instant
corrections and feedback, and build your vocabulary with a flashcard system that
tracks what you know.

## Features

### AI Writing Tutor

- Writing prompts adapted to your CEFR level (A1-C2)
- Instant corrections with detailed feedback
- Contextual explanations for grammar and vocabulary

### Spaced Repetition

- Translation-pair flashcards with SM-2 inspired scheduling
- Deck management with daily limits
- Review history tracking

See [Spaced Repetition](.claude/skills/spaced-repetition/SKILL.md) for the full
architecture and data model.

### Vocabulary Management

- Save phrases with translations
- Organize with tags and decks
- Track difficulty and part of speech

## Tech Stack

- React Native + Expo SDK 55
- Expo Router with native tabs
- WatermelonDB for local-first data
- OpenRouter for AI features
- TypeScript

## Getting Started

Use Node.js 22, as specified in `.nvmrc`.

For a private direct-to-OpenRouter build, set `DRILL_PRIVATE_BUILD=1` and
`EXPO_PUBLIC_OPENROUTER_API_KEY` in `.env.local`. Expo bundles the key into this
build, so keep it private.

For App Store builds, set `DRILL_APP_STORE=1`, `DRILL_IOS_BUILD_NUMBER` to the
version’s next build number, and `DRILL_APP_STORE_OPENROUTER_API_KEY` to a
dedicated key with a low credit limit. Set the key in the build environment or
the ignored `.env.local` file. The public app sends AI requests directly to
OpenRouter. The key is extractable from the build and the cap is shared across
all installations. AI requests stop when the key reaches its cap.

Drill uses Gemini 3.8 Flash Lite TTS for pronunciation and converts the PCM
response to MP3 on the device for compact offline storage.

```bash
# Install dependencies
yarn install

# Start development
yarn start:expo

# Run on iOS/Android
yarn ios
yarn android
```

## Credits

MP3 encoding uses [LAME](https://lame.sourceforge.io/) via the unmodified
[@breezystack/lamejs](https://github.com/shijinyu/lamejs) package (LGPL-3.0).

Built with collaboration from Claude, ChatGPT, and Cursor.
