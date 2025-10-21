import supabase from './supabaseClient';
import type { LibraryItem } from '@/types';

export async function fetchLibraryItems(userId: string) {
  const { data, error } = await supabase.from('library_items').select('*').eq('user_id', userId);
  if (error) {
    throw error;
  }

  return data as LibraryItem[];
}

export async function updateLibraryItemFrequency(itemId: string, frequency: LibraryItem['frequency']) {
  const { error } = await supabase
    .from('library_items')
    .update({ frequency })
    .eq('id', itemId);

  if (error) {
    throw error;
  }
}

export async function createLibraryItem(payload: Partial<LibraryItem> & { userId: string }) {
  const { error } = await supabase.from('library_items').insert({
    user_id: payload.userId,
    type: payload.type,
    content: payload.type === 'phrase' ? payload.content : null,
    translation: payload.type === 'phrase' ? payload.translation ?? null : null,
    concept: payload.type === 'concept' ? payload.concept : null,
    description: payload.type === 'concept' ? payload.description ?? null : null,
    frequency: payload.frequency ?? 'medium'
  });

  if (error) {
    throw error;
  }
}
