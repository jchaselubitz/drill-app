import supabase from './supabaseClient';
import type { LessonItem, LessonRequest } from '@/types';

export interface CreateLessonPayload {
  targetLanguage: string;
  nativeLanguage: string;
  proficiency: string;
  topic: string;
}

export async function requestLessonGeneration(payload: CreateLessonPayload) {
  const { data, error } = await supabase.functions.invoke('generate-content', {
    body: payload
  });

  if (error) {
    throw error;
  }

  return data as { request: LessonRequest; items: LessonItem[] };
}

export async function submitLessonAnswer(lessonId: string, itemId: string, answer: string) {
  const { data, error } = await supabase.functions.invoke('lesson-feedback', {
    body: { lessonId, itemId, answer }
  });

  if (error) {
    throw error;
  }

  return data as {
    feedback: {
      correctedAnswer: string;
      spellingScore: number;
      grammarScore: number;
      notes?: string;
    };
    nextItems?: LessonItem[];
  };
}
