import Database from '@nozbe/watermelondb/Database';

import { PendingAudioRequest, Phrase } from '@/database/models';
import { PHRASE_TABLE } from '@/database/schema';
import type { LanguageCode } from '@/types';

import { saveAudioFile } from './audio/storage';
import { synthesizeSpeech } from './audio/textToSpeech';

// Track in-flight requests by phraseId
const activeRequests = new Map<string, AbortController>();

export interface QueueAudioGenerationParams {
  db: Database;
  phraseId: string;
  phraseText: string;
  deckId: string;
  languageCode: LanguageCode;
}

/**
 * Queues a single phrase for audio generation.
 * Creates a pending request record and starts processing in the background.
 */
export async function queueAudioGeneration({
  db,
  phraseId,
  phraseText,
  deckId,
  languageCode,
}: QueueAudioGenerationParams): Promise<PendingAudioRequest> {
  // Create pending request record
  const pendingRequest = await PendingAudioRequest.create(db, {
    phraseId,
    deckId,
    languageCode,
  });

  // Start processing (don't await - let it run in background)
  processAudioRequest({
    db,
    pendingRequest,
    phraseText,
  });

  return pendingRequest;
}

interface ProcessAudioParams {
  db: Database;
  pendingRequest: PendingAudioRequest;
  phraseText: string;
}

/**
 * Processes a single audio generation request.
 */
async function processAudioRequest({
  db,
  pendingRequest,
  phraseText,
}: ProcessAudioParams): Promise<void> {
  const controller = new AbortController();
  activeRequests.set(pendingRequest.phraseId, controller);

  try {
    await pendingRequest.markProcessing(db);

    // Call TTS API
    const result = await synthesizeSpeech({
      text: phraseText,
      languageCode: pendingRequest.languageCode,
      abortSignal: controller.signal,
    });

    // Save audio file
    const filename = await saveAudioFile(pendingRequest.phraseId, result.audioBase64);

    // Update phrase with filename
    const phrase = await db.collections.get<Phrase>(PHRASE_TABLE).find(pendingRequest.phraseId);
    await phrase.updateFilename(filename);

    // Delete the completed request
    await pendingRequest.delete(db);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Request was cancelled, leave as pending for retry
      return;
    }

    console.error('Audio generation failed:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await pendingRequest.markFailed(db, errorMessage);
  } finally {
    activeRequests.delete(pendingRequest.phraseId);
  }
}

export interface PhraseAudioData {
  phraseId: string;
  phraseText: string;
}

/**
 * Queues all phrases for audio generation, skipping those that already have audio
 * or have a pending request.
 */
export async function queueDeckAudioGeneration(
  db: Database,
  deckId: string,
  primaryLanguage: LanguageCode,
  phraseData: PhraseAudioData[]
): Promise<number> {
  let queuedCount = 0;

  for (const { phraseId, phraseText } of phraseData) {
    // Check if phrase already has audio
    const phrase = await db.collections.get<Phrase>(PHRASE_TABLE).find(phraseId);

    if (phrase.filename) {
      // Already has audio, skip
      continue;
    }

    // Check for existing pending request
    const existingRequest = await PendingAudioRequest.findByPhraseId(db, phraseId);

    if (existingRequest) {
      // Already queued or processing, skip
      continue;
    }

    await queueAudioGeneration({
      db,
      phraseId,
      phraseText,
      deckId,
      languageCode: primaryLanguage,
    });

    queuedCount++;
  }

  return queuedCount;
}

/**
 * Cancels an in-flight request for a phrase.
 */
export function cancelAudioRequest(phraseId: string): void {
  const controller = activeRequests.get(phraseId);
  if (controller) {
    controller.abort();
    activeRequests.delete(phraseId);
  }
}

/**
 * Checks if there's an active request for a phrase.
 */
export function hasActiveAudioRequest(phraseId: string): boolean {
  return activeRequests.has(phraseId);
}

/**
 * Retries all pending audio requests. Call this when the app comes to foreground.
 */
export async function retryPendingAudioRequests(db: Database): Promise<void> {
  const pendingRequests = await PendingAudioRequest.getAllPending(db);

  for (const pendingRequest of pendingRequests) {
    // Skip if already processing
    if (activeRequests.has(pendingRequest.phraseId)) {
      continue;
    }

    // Check if we can retry
    if (!pendingRequest.canRetry) {
      // Max retries exceeded, mark as permanently failed
      await pendingRequest.markFailed(db, 'Max retries exceeded');
      continue;
    }

    // Increment retry count
    await pendingRequest.incrementRetry(db);

    // Get phrase text for retry
    try {
      const phrase = await db.collections.get<Phrase>(PHRASE_TABLE).find(pendingRequest.phraseId);

      processAudioRequest({
        db,
        pendingRequest,
        phraseText: phrase.text,
      });
    } catch (error) {
      console.error('Failed to retry audio request:', error);
    }
  }
}
