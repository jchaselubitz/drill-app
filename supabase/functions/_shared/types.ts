export interface Phrase {
  text: string;
  lang: string;
}
export interface Translation {
  phrase_primary_id?: Phrase;
  phrase_secondary_id?: Phrase;
}
export interface Lesson {
  id: string;
  title: string;
  translation: Translation[];
  side_one: string;
  side_two: string;
}

// Supabase response types (objects or arrays for foreign key relationships)
export interface SupabaseTranslationResponse {
  phrase_primary_id: Phrase | Phrase[];
  phrase_secondary_id: Phrase | Phrase[];
}
export interface SupabaseLessonResponse {
  id: string;
  title: string;
  translation: SupabaseTranslationResponse[];
  side_one: string;
  side_two: string;
}
