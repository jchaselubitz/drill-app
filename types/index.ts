export type LanguageCode =
  | 'en'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ja'
  | 'ko'
  | 'zh'
  | 'ru'
  | 'ar'
  | 'hi'
  | 'nl'
  | 'pl'
  | 'sv'
  | 'tr';

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

export type UserSettings = {
  userLanguage: LanguageCode;
  topicLanguage: LanguageCode;
  level: CEFRLevel;
  apiKey: string;
};
