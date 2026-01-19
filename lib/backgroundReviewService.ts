import Database from '@nozbe/watermelondb/Database';

import { Attempt, PendingRequest } from '@/database/models';
import { ATTEMPT_TABLE, PENDING_REQUEST_TABLE } from '@/database/schema';
import type { LanguageCode } from '@/types';

import { reviewParagraph } from './ai/tutor';

// Track in-flight requests by attemptId
const activeRequests = new Map<string, AbortController>();

export interface SubmitAttemptParams {
  db: Database;
  lessonId: string;
  paragraph: string;
  topicLanguage: LanguageCode;
  userLanguage: LanguageCode;
  level: string;
  abortSignal?: AbortSignal;
}

/**
 * Submits an attempt for review. Creates a pending attempt immediately,
 * then processes the review in the background.
 *
 * Returns the pending attempt so the UI can display it right away.
 */
export async function submitAttemptForReview({
  db,
  lessonId,
  paragraph,
  topicLanguage,
  userLanguage,
  level,
  abortSignal,
}: SubmitAttemptParams): Promise<Attempt> {
  // Create pending attempt immediately so it shows in the UI
  const attempt = await Attempt.createPendingAttempt(db, {
    lessonId,
    paragraph: paragraph.trim(),
    level,
  });

  // Create pending request record for recovery
  await PendingRequest.create(db, {
    attemptId: attempt.id,
    topicLanguage,
    userLanguage,
  });

  // Start the review request (don't await - let it run in background)
  processReview({
    db,
    attemptId: attempt.id,
    paragraph: paragraph.trim(),
    topicLanguage,
    userLanguage,
    level,
  });

  return attempt;
}

interface ProcessReviewParams {
  db: Database;
  attemptId: string;
  paragraph: string;
  topicLanguage: LanguageCode;
  userLanguage: LanguageCode;
  level: string;
}

/**
 * Processes a single review request.
 */
async function processReview({
  db,
  attemptId,
  paragraph,
  topicLanguage,
  userLanguage,
  level,
}: ProcessReviewParams): Promise<void> {
  const controller = new AbortController();
  activeRequests.set(attemptId, controller);

  try {
    const result = await reviewParagraph({
      paragraph,
      topicLanguage,
      userLanguage,
      level,
      abortSignal: controller.signal,
    });

    // Find the attempt and complete it
    const attempt = await db.collections.get<Attempt>(ATTEMPT_TABLE).find(attemptId);

    await attempt.completeWithReview(db, {
      correction: result.correction,
      feedback: result.feedback,
      vocabulary: result.vocabulary,
    });

    // Remove the pending request record
    const pendingRequests = await db.collections
      .get<PendingRequest>(PENDING_REQUEST_TABLE)
      .query()
      .fetch();

    const pendingRequest = pendingRequests.find((pr) => pr.attemptId === attemptId);
    if (pendingRequest) {
      await pendingRequest.delete(db);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // Request was cancelled, leave as pending
      return;
    }

    console.error('Review request failed:', error);

    // Mark attempt as failed
    try {
      const attempt = await db.collections.get<Attempt>(ATTEMPT_TABLE).find(attemptId);
      await attempt.markFailed(db);
    } catch (markError) {
      console.error('Failed to mark attempt as failed:', markError);
    }
  } finally {
    activeRequests.delete(attemptId);
  }
}

/**
 * Cancels an in-flight request for an attempt.
 */
export function cancelRequest(attemptId: string): void {
  const controller = activeRequests.get(attemptId);
  if (controller) {
    controller.abort();
    activeRequests.delete(attemptId);
  }
}

/**
 * Checks if there's an active request for an attempt.
 */
export function hasActiveRequest(attemptId: string): boolean {
  return activeRequests.has(attemptId);
}

/**
 * Retries all pending requests. Call this when the app comes to foreground.
 */
export async function retryPendingRequests(db: Database): Promise<void> {
  const pendingRequests = await PendingRequest.getAllPending(db);

  for (const pendingRequest of pendingRequests) {
    // Skip if already processing
    if (activeRequests.has(pendingRequest.attemptId)) {
      continue;
    }

    // Check if we can retry
    if (!pendingRequest.canRetry) {
      // Mark attempt as failed and delete pending request
      try {
        const attempt = await db.collections
          .get<Attempt>(ATTEMPT_TABLE)
          .find(pendingRequest.attemptId);
        await attempt.markFailed(db);
        await pendingRequest.delete(db);
      } catch (error) {
        console.error('Failed to handle max retries:', error);
      }
      continue;
    }

    // Increment retry count
    await pendingRequest.incrementRetry(db);

    // Get the attempt to retry
    try {
      const attempt = await db.collections
        .get<Attempt>(ATTEMPT_TABLE)
        .find(pendingRequest.attemptId);

      // Only retry if still pending
      if (attempt.status === 'pending') {
        processReview({
          db,
          attemptId: attempt.id,
          paragraph: attempt.paragraph,
          topicLanguage: pendingRequest.topicLanguage,
          userLanguage: pendingRequest.userLanguage,
          level: attempt.level,
        });
      } else {
        // Attempt already completed/failed, clean up pending request
        await pendingRequest.delete(db);
      }
    } catch (error) {
      console.error('Failed to retry pending request:', error);
    }
  }
}

/**
 * Deletes a pending attempt and cancels any in-flight request.
 */
export async function deletePendingAttempt(db: Database, attemptId: string): Promise<void> {
  // Cancel any active request
  cancelRequest(attemptId);

  // Delete the pending request record
  const pendingRequests = await db.collections
    .get<PendingRequest>(PENDING_REQUEST_TABLE)
    .query()
    .fetch();

  const pendingRequest = pendingRequests.find((pr) => pr.attemptId === attemptId);
  if (pendingRequest) {
    await pendingRequest.delete(db);
  }

  // Delete the attempt
  const attempt = await db.collections.get<Attempt>(ATTEMPT_TABLE).find(attemptId);
  await db.write(async () => {
    await attempt.destroyPermanently();
  });
}
