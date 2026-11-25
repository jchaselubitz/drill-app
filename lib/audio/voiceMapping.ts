import type { LanguageCode } from '@/types';

// Drill languages listed in Google's Gemini 3.8 Flash Lite TTS language catalog.
const SPEECH_LANGUAGES: Readonly<Partial<Record<LanguageCode, string>>> = {
  ar: 'Modern Standard Arabic',
  bg: 'Bulgarian',
  bn: 'Bengali',
  ca: 'Catalan',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  es: 'Spanish',
  et: 'Estonian',
  fr: 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  lt: 'Lithuanian',
  lv: 'Latvian',
  ms: 'Malay',
  mt: 'Maltese',
  nb: 'Norwegian Bokmål',
  nl: 'Dutch',
  no: 'Norwegian Bokmål',
  pl: 'Polish',
  pt: 'Portuguese',
  ro: 'Romanian',
  ru: 'Russian',
  sk: 'Slovak',
  tr: 'Turkish',
  vi: 'Vietnamese',
  zh: 'Mandarin Chinese',
};

export function getSpeechLanguage(languageCode: LanguageCode): string | undefined {
  const language = SPEECH_LANGUAGES[languageCode];
  return typeof language === 'string' ? language : undefined;
}

export function isLanguageSupported(languageCode: LanguageCode): boolean {
  return getSpeechLanguage(languageCode) !== undefined;
}
