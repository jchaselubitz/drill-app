import type { CEFRLevel, LanguageCode } from '@/types';

export const models = [
  { label: '3-flash', value: 'gemini-3-flash-preview' },
  { label: '2.5-flash', value: 'gemini-2.5-flash' },
  { label: '2.0-flash', value: 'gemini-2.0-flash' },
  { label: '1.5-flash', value: 'gemini-1.5-flash' },
];

export const LANGUAGES: { code: LanguageCode; name: string }[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'tr', name: 'Turkish' },
];

export const CEFR_LEVELS: { level: CEFRLevel; name: string; description: string }[] = [
  { level: 'A1', name: 'Beginner', description: 'Can understand basic phrases' },
  { level: 'A2', name: 'Elementary', description: 'Can communicate in simple tasks' },
  { level: 'B1', name: 'Intermediate', description: 'Can deal with most travel situations' },
  { level: 'B2', name: 'Upper Intermediate', description: 'Can interact with fluency' },
  { level: 'C1', name: 'Advanced', description: 'Can express ideas fluently' },
  { level: 'C2', name: 'Proficient', description: 'Can understand virtually everything' },
];

export const DEFAULT_SETTINGS = {
  userLanguage: 'en' as LanguageCode,
  topicLanguage: 'es' as LanguageCode,
  level: 'A2' as CEFRLevel,
};

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#FFFFFF',
    card: '#F4F4F5',
    border: '#E4E4E7',
    primary: '#2563EB',
    primaryText: '#FFFFFF',
    success: '#16A34A',
    error: '#DC2626',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    card: '#27272A',
    border: '#3F3F46',
    primary: '#3B82F6',
    primaryText: '#FFFFFF',
    success: '#22C55E',
    error: '#EF4444',
  },
};
