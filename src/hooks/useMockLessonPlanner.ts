import { useLesson } from '@/state/LessonProvider';
import type { LessonItem, LessonRequest, ProficiencyLevel } from '@/types';
import { v4 as uuid } from 'uuid';

interface LessonInput {
  targetLanguage: string;
  nativeLanguage: string;
  proficiency: ProficiencyLevel;
  topic: string;
}

interface MockLesson {
  request: LessonRequest;
  items: LessonItem[];
}

interface EvaluationResult {
  feedback: {
    id: string;
    userAnswer: string;
    correctedAnswer: string;
    spellingScore: number;
    grammarScore: number;
    focusWords: string[];
    focusConcepts: string[];
    notes?: string;
  };
  enqueue: (items: LessonItem[]) => void;
}

export function useMockLessonPlanner() {
  const lesson = useLesson();

  const createMockLesson = (input: LessonInput): MockLesson => {
    const request: LessonRequest = {
      id: uuid(),
      targetLanguage: input.targetLanguage,
      nativeLanguage: input.nativeLanguage,
      proficiency: input.proficiency,
      topic: input.topic,
      createdAt: new Date().toISOString()
    };

    const items = Array.from({ length: 10 }).map((_, index) => mockLessonItem(index, input));

    return { request, items };
  };

  const evaluateMockAnswer = (item: LessonItem, answer: string): EvaluationResult => {
    const spellingScore = answer.length > 0 ? Math.min(100, answer.length * 4) : 0;
    const grammarScore = Math.max(0, 100 - (item.expectedAnswer.length - answer.length) * 5);

    const feedback = {
      id: uuid(),
      userAnswer: answer,
      correctedAnswer: item.expectedAnswer,
      spellingScore,
      grammarScore,
      focusWords: item.focusWords,
      focusConcepts: item.focusConcepts
    };

    return {
      feedback,
      enqueue: (items: LessonItem[]) => lesson.enqueueItems(items)
    };
  };

  const getContinuationItems = (request: LessonRequest, offset: number) => {
    return Array.from({ length: 3 }).map((_, index) => mockLessonItem(offset + index, request));
  };

  return { createMockLesson, evaluateMockAnswer, getContinuationItems };
}

function mockLessonItem(index: number, input: LessonInput | LessonRequest): LessonItem {
  const focusWords = [`${input.topic.split(' ')[0] || 'Word'} ${index + 1}`];
  const focusConcepts = [`${input.topic} concept ${index + 1}`];

  return {
    id: uuid(),
    prompt: `Translate this ${input.topic} sentence #${index + 1}.`,
    expectedAnswer: `${input.targetLanguage ?? 'Target'} phrase ${index + 1}`,
    focusWords,
    focusConcepts
  };
}
