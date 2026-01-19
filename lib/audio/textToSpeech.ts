import Constants from 'expo-constants';

import type { LanguageCode } from '@/types';

import { getVoiceForLanguage } from './voiceMapping';

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';

interface SynthesizeRequest {
  input: { text: string };
  voice: {
    languageCode: string;
    name: string;
  };
  audioConfig: {
    audioEncoding: 'MP3';
    speakingRate?: number;
    pitch?: number;
  };
}

interface SynthesizeResponse {
  audioContent: string; // base64-encoded audio
}

export interface TextToSpeechParams {
  text: string;
  languageCode: LanguageCode;
  abortSignal?: AbortSignal;
}

export interface TextToSpeechResult {
  audioBase64: string;
  voiceName: string;
  voiceType: string;
}

/**
 * Synthesizes speech from text using Google Cloud TTS Neural2/WaveNet API.
 * Returns base64-encoded MP3 audio data.
 */
export async function synthesizeSpeech({
  text,
  languageCode,
  abortSignal,
}: TextToSpeechParams): Promise<TextToSpeechResult> {
  const apiKey = Constants.expoConfig?.extra?.googleCloudTtsApiKey as string | undefined;

  if (!apiKey) {
    throw new Error('Google Cloud TTS API key not configured');
  }

  const voice = getVoiceForLanguage(languageCode);

  const requestBody: SynthesizeRequest = {
    input: { text },
    voice: {
      languageCode: voice.languageCode,
      name: voice.voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.9, // Slightly slower for language learning
    },
  };

  const response = await fetch(`${TTS_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
    signal: abortSignal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS API error (${response.status}): ${errorText}`);
  }

  const data: SynthesizeResponse = await response.json();

  return {
    audioBase64: data.audioContent,
    voiceName: voice.voiceName,
    voiceType: voice.voiceType,
  };
}
