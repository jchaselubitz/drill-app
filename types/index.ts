import { z } from 'zod';

import { LanguagesISO639 } from '@/constants';

export type LanguageCode = (typeof LanguagesISO639)[keyof typeof LanguagesISO639];

export const languageCodeSchema = z.object({
  language_code: z.string(),
});

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type TutorPromptParams = {
  relatedPhrases: string[];
  userLanguage: LanguageCode;
  topicLanguage: LanguageCode;
  level: CEFRLevel;
  instructions: string;
};

export type FeedbackItem = {
  point: string;
  explanation: string;
  negative: boolean;
};

export type VocabularyItem = {
  nativeText: string;
  targetText: string;
  nativeLang: string;
  targetLang: string;
};

export type ReviewResponse = {
  correction: string;
  feedback: FeedbackItem[];
  vocabulary?: VocabularyItem[];
};

export const reviewSchema = z.object({
  correction: z.string(),
  feedback: z.array(
    z.object({
      point: z.string(),
      explanation: z.string(),
      negative: z.boolean(),
    })
  ),
  vocabulary: z
    .array(
      z.object({
        nativeText: z.string(),
        targetText: z.string(),
        nativeLang: z.string(),
        targetLang: z.string(),
      })
    )
    .optional(),
});

export type ExplanationType = 'message' | 'translation' | 'list';

export type ExplanationResponse = {
  type: ExplanationType;
  data: string;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type SrsDirection = 'primary_to_secondary' | 'secondary_to_primary';
export type SrsCardState = 'new' | 'learning' | 'review' | 'relearning';
export type SrsRating = 'failed' | 'hard' | 'good' | 'easy';

export type UserSettings = {
  userLanguage: LanguageCode;
  topicLanguage: LanguageCode;
  level: CEFRLevel;
  theme: ThemeMode;
  lastSkillAnalysisAt?: number;
  maxNewPerDay: number;
  maxReviewsPerDay: number;
  dayStartHour: number;
  autoPlayReviewAudio: boolean;
  activeDeckId?: string | null;
};

export type SkillCategory =
  | 'grammar'
  | 'spelling'
  | 'vocabulary'
  | 'style'
  | 'punctuation'
  | 'sentence_structure'
  | 'tone'
  | 'idioms';

export type SkillStatus = 'active' | 'improving' | 'resolved';

export type SkillRank = 1 | 2 | 3;

export type AnalyzedSkill = {
  name: string;
  category: SkillCategory;
  rank: SkillRank;
  description: string;
  relatedFeedbackIndices: number[];
};

export const skillAnalysisSchema = z.object({
  skills: z.array(
    z.object({
      name: z.string(),
      category: z.enum([
        'grammar',
        'spelling',
        'vocabulary',
        'style',
        'punctuation',
        'sentence_structure',
        'tone',
        'idioms',
      ]),
      rank: z.number().min(1).max(3),
      description: z.string(),
      relatedFeedbackIndices: z.array(z.number()),
    })
  ),
});

export type SkillAnalysisResponse = z.infer<typeof skillAnalysisSchema>;

export const translationResponseSchema = z.object({
  input_text: z.string(),
  input_lang: z.string(),
  output_text: z.string(),
  output_lang: z.string(),
});

export type TranslationResponse = z.infer<typeof translationResponseSchema>;

// Phrase Set Generation types
export type GeneratedPhrase = {
  primary: string;
  secondary: string;
  partOfSpeech?: string;
};

export const phraseSetSchema = z.object({
  phrases: z.array(
    z.object({
      primary: z.string(),
      secondary: z.string(),
      partOfSpeech: z.string().optional(),
    })
  ),
});

export type PhraseSetResponse = z.infer<typeof phraseSetSchema>;

export type PhraseType = 'words' | 'phrases' | 'sentences';

export type GeneratePhraseSetParams = {
  topic: string;
  primaryLanguage: LanguageCode;
  secondaryLanguage: LanguageCode;
  level: CEFRLevel;
  count?: number;
  existingPhrases?: string[];
  phraseType?: PhraseType;
};
