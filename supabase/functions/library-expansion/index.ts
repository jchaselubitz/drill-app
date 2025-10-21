import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface LibraryExpansionPayload {
  lessonId: string;
  focusWordIds?: string[];
  focusConceptIds?: string[];
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const payload = (await req.json()) as LibraryExpansionPayload;

  // TODO: Replace with AI-backed enrichment of vocabulary and concept decks.
  const generatedItems = (payload.focusWordIds ?? []).map((id, index) => ({
    id: crypto.randomUUID(),
    content: `Expanded phrase ${index + 1}`,
    translation: `Translation ${index + 1}`,
    frequency: 'medium'
  }));

  // Persist placeholder expansion for reference.
  if (generatedItems.length > 0) {
    await supabase.from('library_items').insert(
      generatedItems.map((item) => ({
        lesson_id: payload.lessonId,
        type: 'phrase',
        content: item.content,
        translation: item.translation,
        frequency: item.frequency
      }))
    );
  }

  return new Response(JSON.stringify({ items: generatedItems }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
