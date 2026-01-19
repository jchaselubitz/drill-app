import type { LanguageCode } from '@/types';

export type VoiceConfig = {
  voiceName: string;
  languageCode: string;
  voiceType: 'Neural2' | 'WaveNet' | 'Standard';
};

// Maps ISO 639-1 language codes to Google Cloud TTS voice configurations.
// Prioritizes Neural2 > WaveNet > Standard voices for best quality.
const VOICE_MAP: Record<string, VoiceConfig> = {
  // Neural2 voices (highest quality)
  en: { voiceName: 'en-US-Neural2-D', languageCode: 'en-US', voiceType: 'Neural2' },
  de: { voiceName: 'de-DE-Neural2-B', languageCode: 'de-DE', voiceType: 'Neural2' },
  fr: { voiceName: 'fr-FR-Neural2-B', languageCode: 'fr-FR', voiceType: 'Neural2' },
  da: { voiceName: 'da-DK-Neural2-D', languageCode: 'da-DK', voiceType: 'Neural2' },
  es: { voiceName: 'es-ES-Neural2-B', languageCode: 'es-ES', voiceType: 'Neural2' },
  it: { voiceName: 'it-IT-Neural2-A', languageCode: 'it-IT', voiceType: 'Neural2' },
  pt: { voiceName: 'pt-PT-Neural2-B', languageCode: 'pt-PT', voiceType: 'Neural2' },
  nl: { voiceName: 'nl-NL-Neural2-C', languageCode: 'nl-NL', voiceType: 'Neural2' },

  // WaveNet voices (high quality, broader language support)
  sv: { voiceName: 'sv-SE-Wavenet-A', languageCode: 'sv-SE', voiceType: 'WaveNet' },
  pl: { voiceName: 'pl-PL-Wavenet-B', languageCode: 'pl-PL', voiceType: 'WaveNet' },
  ru: { voiceName: 'ru-RU-Wavenet-B', languageCode: 'ru-RU', voiceType: 'WaveNet' },
  ja: { voiceName: 'ja-JP-Wavenet-C', languageCode: 'ja-JP', voiceType: 'WaveNet' },
  ko: { voiceName: 'ko-KR-Wavenet-A', languageCode: 'ko-KR', voiceType: 'WaveNet' },
  zh: { voiceName: 'cmn-CN-Wavenet-C', languageCode: 'cmn-CN', voiceType: 'WaveNet' },
  ar: { voiceName: 'ar-XA-Wavenet-B', languageCode: 'ar-XA', voiceType: 'WaveNet' },
  hi: { voiceName: 'hi-IN-Wavenet-B', languageCode: 'hi-IN', voiceType: 'WaveNet' },
  tr: { voiceName: 'tr-TR-Wavenet-B', languageCode: 'tr-TR', voiceType: 'WaveNet' },
  vi: { voiceName: 'vi-VN-Wavenet-A', languageCode: 'vi-VN', voiceType: 'WaveNet' },
  el: { voiceName: 'el-GR-Wavenet-A', languageCode: 'el-GR', voiceType: 'WaveNet' },
  fi: { voiceName: 'fi-FI-Wavenet-A', languageCode: 'fi-FI', voiceType: 'WaveNet' },
  hu: { voiceName: 'hu-HU-Wavenet-A', languageCode: 'hu-HU', voiceType: 'WaveNet' },
  id: { voiceName: 'id-ID-Wavenet-A', languageCode: 'id-ID', voiceType: 'WaveNet' },
  uk: { voiceName: 'uk-UA-Wavenet-A', languageCode: 'uk-UA', voiceType: 'WaveNet' },
  he: { voiceName: 'he-IL-Wavenet-A', languageCode: 'he-IL', voiceType: 'WaveNet' },
  ro: { voiceName: 'ro-RO-Wavenet-A', languageCode: 'ro-RO', voiceType: 'WaveNet' },
  sk: { voiceName: 'sk-SK-Wavenet-A', languageCode: 'sk-SK', voiceType: 'WaveNet' },
  bg: { voiceName: 'bg-BG-Standard-A', languageCode: 'bg-BG', voiceType: 'Standard' },
  cs: { voiceName: 'cs-CZ-Wavenet-A', languageCode: 'cs-CZ', voiceType: 'WaveNet' },
  nb: { voiceName: 'nb-NO-Wavenet-B', languageCode: 'nb-NO', voiceType: 'WaveNet' },
  no: { voiceName: 'nb-NO-Wavenet-B', languageCode: 'nb-NO', voiceType: 'WaveNet' },
  bn: { voiceName: 'bn-IN-Wavenet-A', languageCode: 'bn-IN', voiceType: 'WaveNet' },
  ms: { voiceName: 'ms-MY-Wavenet-A', languageCode: 'ms-MY', voiceType: 'WaveNet' },

  // Standard voices (broader support)
  th: { voiceName: 'th-TH-Standard-A', languageCode: 'th-TH', voiceType: 'Standard' },
  hr: { voiceName: 'sr-RS-Standard-A', languageCode: 'sr-RS', voiceType: 'Standard' },
  lt: { voiceName: 'lt-LT-Standard-A', languageCode: 'lt-LT', voiceType: 'Standard' },
  lv: { voiceName: 'lv-LV-Standard-A', languageCode: 'lv-LV', voiceType: 'Standard' },
  sl: { voiceName: 'sr-RS-Standard-A', languageCode: 'sr-RS', voiceType: 'Standard' },
  et: { voiceName: 'et-EE-Standard-A', languageCode: 'et-EE', voiceType: 'Standard' },
  ur: { voiceName: 'ur-IN-Standard-A', languageCode: 'ur-IN', voiceType: 'Standard' },
};

// Default fallback voice for unsupported languages
const DEFAULT_VOICE: VoiceConfig = {
  voiceName: 'en-US-Neural2-D',
  languageCode: 'en-US',
  voiceType: 'Neural2',
};

export function getVoiceForLanguage(langCode: LanguageCode): VoiceConfig {
  return VOICE_MAP[langCode] ?? DEFAULT_VOICE;
}

export function isLanguageSupported(langCode: LanguageCode): boolean {
  return langCode in VOICE_MAP;
}

export function getSupportedLanguages(): string[] {
  return Object.keys(VOICE_MAP);
}
