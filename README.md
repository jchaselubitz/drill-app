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

- React Native + Expo SDK 54
- Expo Router with native tabs
- WatermelonDB for local-first data
- Google Gemini Flash for AI features
- TypeScript

## Getting Started

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

Built with collaboration from Claude, ChatGPT, and Cursor.
