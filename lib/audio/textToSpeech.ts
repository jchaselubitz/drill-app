import { Mp3Encoder } from '@breezystack/lamejs';

import type { LanguageCode } from '@/types';

import { requestOpenRouter } from '../openRouter';
import { getSpeechLanguage } from './voiceMapping';

const TTS_MODEL = 'google/gemini-3.8-flash-lite-tts';
const SAMPLE_RATE = 24_000;
const CHANNEL_COUNT = 1;
const BITS_PER_SAMPLE = 16;
const FRAME_SIZE = (CHANNEL_COUNT * BITS_PER_SAMPLE) / 8;
const MP3_BITRATE_KBPS = 64;
const SAMPLES_PER_BLOCK = 1152;

export interface TextToSpeechParams {
  text: string;
  languageCode: LanguageCode;
  abortSignal?: AbortSignal;
}

function encodePcmAsMp3(pcm: Uint8Array): Uint8Array {
  if (pcm.length === 0 || pcm.length % FRAME_SIZE !== 0) {
    throw new Error('OpenRouter returned empty or incomplete PCM audio');
  }

  const encoder = new Mp3Encoder(CHANNEL_COUNT, SAMPLE_RATE, MP3_BITRATE_KBPS);
  const samples = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const sampleCount = pcm.byteLength / FRAME_SIZE;
  const chunks: Uint8Array[] = [];

  for (let start = 0; start < sampleCount; start += SAMPLES_PER_BLOCK) {
    const block = new Int16Array(Math.min(SAMPLES_PER_BLOCK, sampleCount - start));
    for (let i = 0; i < block.length; i++) {
      block[i] = samples.getInt16((start + i) * FRAME_SIZE, true);
    }
    chunks.push(encoder.encodeBuffer(block));
  }
  chunks.push(encoder.flush());

  const mp3 = new Uint8Array(chunks.reduce((length, chunk) => length + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    mp3.set(chunk, offset);
    offset += chunk.length;
  }
  return mp3;
}

export async function synthesizeSpeech({
  text,
  languageCode,
  abortSignal,
}: TextToSpeechParams): Promise<Uint8Array> {
  const language = getSpeechLanguage(languageCode);
  if (!language) {
    throw new Error('Audio generation is not available for this language.');
  }

  const response = await requestOpenRouter(
    '/audio/speech',
    {
      model: TTS_MODEL,
      input: text,
      instructions: `Speak in ${language} with clear pronunciation and a slightly slower pace.`,
      voice: 'Kore',
      response_format: 'pcm',
    },
    abortSignal
  );

  const [contentType, ...parameters] = (response.headers.get('content-type') ?? '')
    .toLowerCase()
    .split(';');
  const format = new Map(
    parameters.map((parameter) => parameter.trim().split(/\s*=\s*/, 2) as [string, string])
  );
  if (
    contentType.trim() !== 'audio/pcm' ||
    (format.has('rate') && Number(format.get('rate')) !== SAMPLE_RATE) ||
    (format.has('channels') && Number(format.get('channels')) !== CHANNEL_COUNT)
  ) {
    throw new Error('OpenRouter returned an unexpected speech format');
  }

  return encodePcmAsMp3(new Uint8Array(await response.arrayBuffer()));
}
