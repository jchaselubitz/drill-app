import { LessonItemPayload, LessonRequestPayload, CorrectionRequestPayload, CorrectionResponsePayload } from './types';

export async function createLessonFromProvider(
  request: LessonRequestPayload
): Promise<{ items: LessonItemPayload[]; rawResponse: unknown }> {
  // TODO: Replace mock with OpenAI or Google PaLM integration.
  console.log('Stub createLessonFromProvider called with', request);
  return {
    items: Array.from({ length: 10 }).map((_, index) => ({
      id: `${Date.now()}-${index}`,
      prompt: `${request.topic} prompt ${index + 1}`,
      suggestedAnswer: `${request.topic} answer ${index + 1}`,
      focus: {
        terms: request.library.terms.slice(0, 2),
        concepts: request.library.concepts.slice(0, 2)
      }
    })),
    rawResponse: null
  };
}

export async function scoreAttemptWithProvider(
  payload: CorrectionRequestPayload
): Promise<{ data: CorrectionResponsePayload; rawResponse: unknown }> {
  // TODO: Replace with external AI scoring logic.
  console.log('Stub scoreAttemptWithProvider called with', payload);
  return {
    data: {
      corrected: payload.reference,
      spellingScore: 92,
      grammarScore: 88,
      rationale: 'Placeholder rationale: connect to AI provider via Supabase Function.'
    },
    rawResponse: null
  };
}
