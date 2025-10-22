import { LessonItem, LessonRequest } from '@types/lesson';

const fallbackTerms: Record<string, string[]> = {
  German: ['Freundschaft', 'Verbinder', 'Struktur', 'Abschluss', 'Verbindung'],
  Spanish: ['Conjugación', 'Acuerdo', 'Frase', 'Tiempo', 'Estructura']
};

export function generateMockLessonItems(request: LessonRequest): LessonItem[] {
  const focusTerms = fallbackTerms[request.language] ?? ['Concept', 'Syntax', 'Usage'];
  return Array.from({ length: 10 }).map((_, index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2, 10)}`,
    prompt: `${request.topic} example ${index + 1}`,
    suggestedAnswer: `${request.topic} answer ${index + 1} in ${request.language}`,
    focus: {
      terms: [focusTerms[index % focusTerms.length]],
      concepts: [`${request.topic} concept ${index + 1}`]
    }
  }));
}
