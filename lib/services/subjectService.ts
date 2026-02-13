import type Database from '@nozbe/watermelondb/Database';

import { Deck, Lesson, Phrase, Subject, Translation } from '@/database/models';
import { DECK_TRANSLATION_TABLE } from '@/database/schema';
import { generatePhraseSet } from '@/lib/ai/generatePhraseSet';
import {
  generateLearningLanguagePrompt,
  generateUserLanguagePromptWithVocabulary,
  type VocabularyItem,
} from '@/lib/ai/learningPrompt';
import { generateTutorPrompt } from '@/lib/ai/tutor';
import { ensureSrsCardsForTranslation } from '@/lib/srs/cards';
import type { CEFRLevel, GeneratedPhrase, LanguageCode, PhraseType } from '@/types';

export interface CreateUnifiedSubjectParams {
  topic: string;
  phraseType: PhraseType;
  primaryLang: LanguageCode;
  secondaryLang: LanguageCode;
  level: CEFRLevel;
  phraseCount?: number;
}

export interface UnifiedSubjectResult {
  subject: Subject;
  deck: Deck;
  lesson: Lesson;
  phrases: GeneratedPhrase[];
}

/**
 * Creates a unified subject with both a vocabulary set (Deck) and a writing prompt (Lesson).
 * This is the main entry point for the unified lesson creation flow.
 */
export async function createUnifiedSubject(
  db: Database,
  params: CreateUnifiedSubjectParams
): Promise<UnifiedSubjectResult> {
  const { topic, phraseType, primaryLang, secondaryLang, level, phraseCount = 20 } = params;

  // Step 1: Generate vocabulary phrases
  const generatedPhrases = await generatePhraseSet({
    topic,
    primaryLanguage: primaryLang,
    secondaryLanguage: secondaryLang,
    level,
    count: phraseCount,
    phraseType,
  });

  // Step 2: Create Subject record first (without deck_id, we'll update it after)
  const subject = await Subject.createSubject(db, {
    name: topic,
    level,
    primaryLang,
    secondaryLang,
    deckId: null,
  });

  // Step 3: Create Deck with phrases
  const deck = await Deck.createAISet(db, {
    name: topic,
    topic,
    primaryLang,
    secondaryLang,
    level,
    subjectId: subject.id,
  });

  // Update subject with deck_id
  await db.write(async () => {
    await subject.update((s) => {
      s.deckId = deck.id;
      s.updatedAt = Date.now();
    });
  });

  // Step 4: Create phrases, translations, and SRS cards
  for (const phrase of generatedPhrases) {
    const primaryPhrase = await Phrase.findOrCreatePhrase(db, {
      text: phrase.primary,
      lang: primaryLang,
      source: 'ai_generated',
      partSpeech: phrase.partOfSpeech ?? null,
      favorite: false,
      filename: null,
      type: phraseType === 'words' ? 'word' : 'phrase',
      note: null,
      difficulty: null,
      historyId: null,
      attemptId: null,
    });

    const secondaryPhrase = await Phrase.findOrCreatePhrase(db, {
      text: phrase.secondary,
      lang: secondaryLang,
      source: 'ai_generated',
      partSpeech: phrase.partOfSpeech ?? null,
      favorite: false,
      filename: null,
      type: phraseType === 'words' ? 'word' : 'phrase',
      note: null,
      difficulty: null,
      historyId: null,
      attemptId: null,
    });

    const translation = await Translation.addTranslation(db, {
      phrasePrimaryId: primaryPhrase.id,
      phraseSecondaryId: secondaryPhrase.id,
    });

    await db.write(async () => {
      await db.collections.get(DECK_TRANSLATION_TABLE).create((dt: any) => {
        dt.deckId = deck.id;
        dt.translationId = translation.id;
        dt.createdAt = Date.now();
        dt.updatedAt = Date.now();
      });
    });

    await ensureSrsCardsForTranslation(db, {
      deckId: deck.id,
      translationId: translation.id,
      nowMs: Date.now(),
    });
  }

  // Step 5: Generate initial writing prompt (in user's language)
  const prompt = await generateTutorPrompt({
    relatedPhrases: generatedPhrases.slice(0, 10).map((p) => p.primary),
    userLanguage: secondaryLang,
    topicLanguage: primaryLang,
    level,
    instructions: topic,
  });

  // Step 6: Create Lesson linked to Subject
  const lesson = await Lesson.addLesson(db, {
    topic,
    phrases: generatedPhrases
      .slice(0, 10)
      .map((p) => p.primary)
      .join(', '),
    prompt,
    lang: primaryLang,
    level,
    subjectId: subject.id,
    promptLanguage: 'user',
  });

  return {
    subject,
    deck,
    lesson,
    phrases: generatedPhrases,
  };
}

/**
 * Generates a new prompt for an existing subject.
 * Can generate either in user language or learning language.
 */
export async function generateNewPromptForSubject(
  db: Database,
  subject: Subject,
  deck: Deck,
  promptType: 'user' | 'learning'
): Promise<Lesson> {
  // Get vocabulary from deck translations
  const vocabulary = await getVocabularyFromDeck(db, deck.id);

  let prompt: string;

  if (promptType === 'learning') {
    prompt = await generateLearningLanguagePrompt({
      topic: subject.name,
      vocabulary,
      learningLanguage: subject.primaryLang as LanguageCode,
      userLanguage: subject.secondaryLang as LanguageCode,
      level: subject.level as CEFRLevel,
    });
  } else {
    prompt = await generateUserLanguagePromptWithVocabulary({
      topic: subject.name,
      vocabulary,
      learningLanguage: subject.primaryLang as LanguageCode,
      userLanguage: subject.secondaryLang as LanguageCode,
      level: subject.level as CEFRLevel,
    });
  }

  // Create new lesson linked to subject
  const lesson = await Lesson.addLesson(db, {
    topic: subject.name,
    phrases: vocabulary
      .slice(0, 10)
      .map((v) => v.primary)
      .join(', '),
    prompt,
    lang: subject.primaryLang,
    level: subject.level,
    subjectId: subject.id,
    promptLanguage: promptType,
  });

  return lesson;
}

/**
 * Converts an orphan deck (no subject) into a full topic (Subject).
 * Creates a Subject from the deck's metadata and links them bidirectionally.
 */
export async function convertDeckToSubject(db: Database, deck: Deck): Promise<Subject> {
  const subject = await Subject.createSubject(db, {
    name: deck.name,
    level: (deck.level as CEFRLevel) ?? 'A1',
    primaryLang: (deck.primaryLang as LanguageCode) ?? 'ja',
    secondaryLang: (deck.secondaryLang as LanguageCode) ?? 'en',
    deckId: deck.id,
  });

  await db.write(async () => {
    await deck.update((d) => {
      d.subjectId = subject.id;
      d.updatedAt = Date.now();
    });
  });

  return subject;
}

/**
 * Links a free (unlinked) lesson and deck into a new topic (Subject).
 * Creates a Subject using the lesson's metadata, then updates both the lesson and deck to point to it.
 */
export async function linkFreeItemsToTopic(
  db: Database,
  { lesson, deck }: { lesson: Lesson; deck: Deck }
): Promise<Subject> {
  // Create a new Subject from the lesson's metadata
  const subject = await Subject.createSubject(db, {
    name: lesson.topic,
    level: lesson.level as CEFRLevel,
    primaryLang: lesson.lang as LanguageCode,
    secondaryLang: deck.secondaryLang as LanguageCode,
    deckId: deck.id,
  });

  // Update the deck and lesson to point to the new subject
  await db.write(async () => {
    await deck.update((d) => {
      d.subjectId = subject.id;
      d.updatedAt = Date.now();
    });
    await lesson.update((l) => {
      l.subjectId = subject.id;
      l.updatedAt = Date.now();
    });
  });

  return subject;
}

/**
 * Helper to get vocabulary items from a deck's translations
 */
export async function getVocabularyFromDeck(
  db: Database,
  deckId: string
): Promise<VocabularyItem[]> {
  const deckTranslations = await db.collections.get(DECK_TRANSLATION_TABLE).query().fetch();

  const relevantDeckTranslations = deckTranslations.filter((dt: any) => dt.deckId === deckId);

  const vocabulary: VocabularyItem[] = [];

  for (const dt of relevantDeckTranslations) {
    try {
      const translation = await db.collections.get('translation').find((dt as any).translationId);

      const primaryPhrase = await db.collections
        .get('phrase')
        .find((translation as any).phrasePrimaryId);

      const secondaryPhrase = await db.collections
        .get('phrase')
        .find((translation as any).phraseSecondaryId);

      vocabulary.push({
        primary: (primaryPhrase as any).text,
        secondary: (secondaryPhrase as any).text,
      });
    } catch {
      // Skip if translation or phrases not found
      continue;
    }
  }

  return vocabulary;
}
