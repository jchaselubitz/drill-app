import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FeedbackPayload {
  lessonId: string;
  itemId: string;
  answer: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const payload = (await req.json()) as FeedbackPayload;

  // TODO: Replace mock evaluation with call to LLM provider via OpenAI or Google.
  const mockScore = Math.min(100, Math.floor(payload.answer.length * 4));
  const feedback = {
    correctedAnswer: `${payload.answer} (corrected)`.
      replace(/\s+/g, ' ')
      .trim(),
    spellingScore: mockScore,
    grammarScore: Math.max(60, mockScore - 10),
    notes: 'This is placeholder feedback. Replace with model response.'
  };

  await supabase.from('lesson_submissions').insert({
    lesson_id: payload.lessonId,
    lesson_item_id: payload.itemId,
    user_answer: payload.answer,
    spelling_score: feedback.spellingScore,
    grammar_score: feedback.grammarScore
  });

  const nextItems = Array.from({ length: 2 }).map((_, index) => ({
    id: crypto.randomUUID(),
    prompt: `Follow-up prompt #${index + 1}`,
    expectedAnswer: `Sample answer ${index + 1}`,
    focusWords: [`word ${index + 1}`],
    focusConcepts: [`concept ${index + 1}`]
  }));

  return new Response(
    JSON.stringify({
      feedback,
      nextItems
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
