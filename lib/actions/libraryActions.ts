import { supabase } from '@/lib/supabase';
import { Phrase } from '@/supabase/functions/_shared/types';

import { Iso639LanguageCode, SourceOptionType } from '../lists';

// Extended types for the complex query response
export interface Tag {
  id: string;
  label: string;
  userId: string;
  createdAt: string;
}

export interface RelatedPhrase {
  id: string;
  text: string;
  lang: string;
  createdAt: string;
  partSpeech: string;
  source: string;
  userId: string;
  note: string;
}

export interface Translation {
  id: string;
  lessonId: string;
  lessonTitle?: string;
  phrases: RelatedPhrase[];
}

export interface Association {
  id: string;
  phrases: RelatedPhrase[];
}

export interface PhraseWithAssociations extends Phrase {
  id: string;
  text: string;
  lang: string;
  createdAt: string;
  partSpeech: string;
  source: string;
  userId: string;
  favorite: boolean;
  type: string;
  filename?: string;
  note?: string;
  historyId?: string;
  difficulty?: string;
  tags: Tag[];
  translations: Translation[];
  associations: Association[];
}
export const getPhrases = async ({
  source,
  pastDays,
  lang,
}: {
  source?: SourceOptionType;
  pastDays?: number;
  lang?: Iso639LanguageCode;
}): Promise<PhraseWithAssociations[]> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  if (!userId) {
    return [];
  }

  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (pastDays || 30));

  // Build the base query for phrases
  let query = supabase
    .from('phrase')
    .select(
      `
      id,
      text,
      lang,
      createdAt,
      partSpeech,
      source,
      userId,
      favorite,
      type,
      filename,
      note,
      historyId,
      difficulty
    `
    )
    .eq('userId', userId)
    .order('createdAt', { ascending: false });

  // Apply filters
  if (source) {
    query = query.eq('source', source);
  }

  if (pastDays) {
    query = query.gte('createdAt', startDate.toISOString());
  }

  if (lang) {
    query = query.eq('lang', lang);
  }

  const { data: phrases, error: phrasesError } = await query;

  if (phrasesError) throw phrasesError;
  if (!phrases) return [];

  // Get phrase IDs for subsequent queries
  const phraseIds = phrases.map((p) => p.id);

  // Fetch tags for all phrases
  const { data: tags, error: tagsError } = await supabase
    .from('phraseTag')
    .select(
      `
      phraseId,
      tag:tagId (
        id,
        label,
        userId,
        createdAt
      )
    `
    )
    .in('phraseId', phraseIds)
    .eq('tag.userId', userId);

  if (tagsError) throw tagsError;

  // Fetch translations for all phrases
  const { data: translations, error: translationsError } = await supabase
    .from('translation')
    .select(
      `
      id,
      lessonId,
      phrasePrimaryId,
      phraseSecondaryId,
      lesson:lessonId (
        id,
        title
      ),
      phrasePrimary:phrasePrimaryId (
        id,
        text,
        lang,
        createdAt,
        partSpeech,
        source,
        userId,
        note
      ),
      phraseSecondary:phraseSecondaryId (
        id,
        text,
        lang,
        createdAt,
        partSpeech,
        source,
        userId,
        note
      )
    `
    )
    .or(
      `phrasePrimaryId.in.(${phraseIds.join(',')}),phraseSecondaryId.in.(${phraseIds.join(',')})`
    );

  if (translationsError) throw translationsError;

  // Fetch associations for all phrases
  const { data: associations, error: associationsError } = await supabase
    .from('association')
    .select(
      `
      id,
      phrasePrimaryId,
      phraseSecondaryId,
      phrasePrimary:phrasePrimaryId (
        id,
        text,
        lang,
        createdAt,
        partSpeech,
        source,
        userId,
        note
      ),
      phraseSecondary:phraseSecondaryId (
        id,
        text,
        lang,
        createdAt,
        partSpeech,
        source,
        userId,
        note
      )
    `
    )
    .or(
      `phrasePrimaryId.in.(${phraseIds.join(',')}),phraseSecondaryId.in.(${phraseIds.join(',')})`
    );

  if (associationsError) throw associationsError;

  // Group related data by phrase ID
  const tagsByPhrase = (tags || []).reduce((acc, item) => {
    if (!acc[item.phraseId]) acc[item.phraseId] = [];
    if (item.tag && Array.isArray(item.tag) && item.tag.length > 0) {
      acc[item.phraseId].push(item.tag[0] as Tag);
    }
    return acc;
  }, {} as Record<string, Tag[]>);

  const translationsByPhrase = (translations || []).reduce((acc, item) => {
    // Determine which phrase this translation belongs to
    const primaryPhraseId = item.phrasePrimaryId;
    const secondaryPhraseId = item.phraseSecondaryId;

    // Add to both phrases if they're in our result set
    if (phraseIds.includes(primaryPhraseId)) {
      if (!acc[primaryPhraseId]) acc[primaryPhraseId] = [];

      const relatedPhrases: RelatedPhrase[] = [];
      if (
        item.phraseSecondary &&
        Array.isArray(item.phraseSecondary) &&
        item.phraseSecondary.length > 0
      ) {
        const secondary = item.phraseSecondary[0];
        if (secondary.id !== primaryPhraseId) {
          relatedPhrases.push(secondary as RelatedPhrase);
        }
      }

      const lessonTitle =
        Array.isArray(item.lesson) && item.lesson.length > 0 ? item.lesson[0].title : undefined;

      acc[primaryPhraseId].push({
        id: item.id,
        lessonId: item.lessonId,
        lessonTitle,
        phrases: relatedPhrases,
      });
    }

    if (phraseIds.includes(secondaryPhraseId)) {
      if (!acc[secondaryPhraseId]) acc[secondaryPhraseId] = [];

      const relatedPhrases: RelatedPhrase[] = [];
      if (
        item.phrasePrimary &&
        Array.isArray(item.phrasePrimary) &&
        item.phrasePrimary.length > 0
      ) {
        const primary = item.phrasePrimary[0];
        if (primary.id !== secondaryPhraseId) {
          relatedPhrases.push(primary as RelatedPhrase);
        }
      }

      const lessonTitle =
        Array.isArray(item.lesson) && item.lesson.length > 0 ? item.lesson[0].title : undefined;

      acc[secondaryPhraseId].push({
        id: item.id,
        lessonId: item.lessonId,
        lessonTitle,
        phrases: relatedPhrases,
      });
    }

    return acc;
  }, {} as Record<string, Translation[]>);

  const associationsByPhrase = (associations || []).reduce((acc, item) => {
    // Determine which phrase this association belongs to
    const primaryPhraseId = item.phrasePrimaryId;
    const secondaryPhraseId = item.phraseSecondaryId;

    // Add to both phrases if they're in our result set
    if (phraseIds.includes(primaryPhraseId)) {
      if (!acc[primaryPhraseId]) acc[primaryPhraseId] = [];

      const relatedPhrases: RelatedPhrase[] = [];
      if (
        item.phraseSecondary &&
        Array.isArray(item.phraseSecondary) &&
        item.phraseSecondary.length > 0
      ) {
        const secondary = item.phraseSecondary[0];
        if (secondary.id !== primaryPhraseId) {
          relatedPhrases.push(secondary as RelatedPhrase);
        }
      }

      acc[primaryPhraseId].push({
        id: item.id,
        phrases: relatedPhrases,
      });
    }

    if (phraseIds.includes(secondaryPhraseId)) {
      if (!acc[secondaryPhraseId]) acc[secondaryPhraseId] = [];

      const relatedPhrases: RelatedPhrase[] = [];
      if (
        item.phrasePrimary &&
        Array.isArray(item.phrasePrimary) &&
        item.phrasePrimary.length > 0
      ) {
        const primary = item.phrasePrimary[0];
        if (primary.id !== secondaryPhraseId) {
          relatedPhrases.push(primary as RelatedPhrase);
        }
      }

      acc[secondaryPhraseId].push({
        id: item.id,
        phrases: relatedPhrases,
      });
    }

    return acc;
  }, {} as Record<string, Association[]>);

  // Combine everything
  return phrases.map((phrase) => ({
    ...phrase,
    tags: tagsByPhrase[phrase.id] || [],
    translations: translationsByPhrase[phrase.id] || [],
    associations: associationsByPhrase[phrase.id] || [],
  }));
};
