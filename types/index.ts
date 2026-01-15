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
export type ReviewResponse = {
  correction: string;
  feedback: FeedbackItem[];
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
});

export type ExplanationType = 'message' | 'translation' | 'list';

export type ExplanationResponse = {
  type: ExplanationType;
  data: string;
};

export type ThemeMode = 'light' | 'dark' | 'system';

export type UserSettings = {
  userLanguage: LanguageCode;
  topicLanguage: LanguageCode;
  level: CEFRLevel;
  theme: ThemeMode;
  lastSkillAnalysisAt?: number;
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
