import { LessonRequest } from '@/types/lesson';

const FUNCTION_HEADERS = {
  'Content-Type': 'application/json',
};

export async function requestLessonGeneration(request: LessonRequest) {
  const response = await fetch(`${process.env.EXPO_PUBLIC_OPENAI_PROXY_URL}/generate-lesson`, {
    method: 'POST',
    headers: FUNCTION_HEADERS,
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error('Failed to request lesson generation');
  }
  return response.json();
}

export async function submitAttempt(payload: {
  attempt: string;
  reference: string;
  language: string;
  lessonId: string;
  itemId: string;
}) {
  const response = await fetch(`${process.env.EXPO_PUBLIC_OPENAI_PROXY_URL}/score-attempt`, {
    method: 'POST',
    headers: FUNCTION_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to score attempt');
  }
  return response.json();
}
