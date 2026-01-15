import type { ReviewResponse } from '@/types';

/**
 * Validates that feedback matches the ReviewResponse['feedback'] format.
 * Throws descriptive errors if validation fails.
 *
 * @param feedback - The feedback to validate
 * @param context - Optional context for error messages (e.g., "database", "input")
 * @param attemptId - Optional attempt ID for error messages
 * @returns The validated feedback array
 * @throws Error if feedback format is invalid
 */
export function validateFeedback(
  feedback: unknown,
  context: { source?: string; attemptId?: string } = {}
): ReviewResponse['feedback'] {
  const { source = 'input', attemptId } = context;

  if (!Array.isArray(feedback)) {
    const contextMsg = attemptId ? ` Attempt ID: ${attemptId}.` : '';
    throw new Error(
      `Invalid feedback format${source === 'database' ? ' in database' : ''}: expected array, got ${typeof feedback}.${contextMsg} Feedback must be an array of objects with 'point', 'explanation', and 'negative' properties.`
    );
  }

  // Validate each feedback item has the correct structure
  for (let i = 0; i < feedback.length; i++) {
    const item = feedback[i];
    if (
      typeof item !== 'object' ||
      item === null ||
      !('point' in item) ||
      !('explanation' in item) ||
      !('negative' in item)
    ) {
      const contextMsg = attemptId ? ` Attempt ID: ${attemptId}.` : '';
      throw new Error(
        `Invalid feedback item at index ${i}${source === 'database' ? ' in database' : ''}: expected object with 'point', 'explanation', and 'negative' properties, got ${typeof item}.${contextMsg}`
      );
    }
    if (
      typeof item.point !== 'string' ||
      typeof item.explanation !== 'string' ||
      typeof item.negative !== 'boolean'
    ) {
      const contextMsg = attemptId ? ` Attempt ID: ${attemptId}.` : '';
      throw new Error(
        `Invalid feedback item at index ${i}${source === 'database' ? ' in database' : ''}: 'point' and 'explanation' must be strings and 'negative' must be a boolean.${contextMsg}`
      );
    }
  }

  return feedback as ReviewResponse['feedback'];
}
