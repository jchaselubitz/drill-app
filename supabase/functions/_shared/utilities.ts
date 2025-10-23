import { Lesson, SupabaseLessonResponse } from './types.ts';

export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // Convert buffer to byte array
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, 15);
}

export function mapSupabaseLessonToLesson(supabaseLesson: SupabaseLessonResponse): Lesson {
  return {
    id: supabaseLesson.id,
    title: supabaseLesson.title,
    side_one: supabaseLesson.side_one,
    side_two: supabaseLesson.side_two,
    translation: supabaseLesson.translation
      .map((t) => ({
        phrase_primary_id: Array.isArray(t.phrase_primary_id)
          ? t.phrase_primary_id[0]
          : t.phrase_primary_id,
        phrase_secondary_id: Array.isArray(t.phrase_secondary_id)
          ? t.phrase_secondary_id[0]
          : t.phrase_secondary_id,
      }))
      .filter((t) => t.phrase_primary_id && t.phrase_secondary_id),
  };
}
