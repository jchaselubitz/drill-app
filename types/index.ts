import { LanguagesISO639 } from '@/constants';

export type LanguageCode = (typeof LanguagesISO639)[keyof typeof LanguagesISO639];

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type TutorPromptParams = {
  relatedPhrases: string[];
  userLanguage: LanguageCode;
  topicLanguage: LanguageCode;
  level: CEFRLevel;
  instructions: string;
};

export type ReviewResponse = {
  correction: string;
  feedback: string;
};

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
};
