import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.1';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const openAiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GenerateContentPayload {
  targetLanguage: string;
  nativeLanguage: string;
  proficiency: string;
  topic: string;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const payload = (await req.json()) as GenerateContentPayload;

  // TODO: Replace with call to OpenAI or Google generative API.
  // This placeholder stores the request metadata and returns mocked lesson items so the client can
  // render UI during development.
  const { data: request, error: insertError } = await supabase
    .from('lesson_requests')
    .insert({
      target_language: payload.targetLanguage,
      native_language: payload.nativeLanguage,
      proficiency: payload.proficiency,
      topic: payload.topic
    })
    .select()
    .single();

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  const items = Array.from({ length: 10 }).map((_, index) => ({
    id: crypto.randomUUID(),
    prompt: `Translate placeholder sentence #${index + 1}`,
    expectedAnswer: `${payload.targetLanguage} sample ${index + 1}`,
    focusWords: [`${payload.topic} word ${index + 1}`],
    focusConcepts: [`${payload.topic} concept ${index + 1}`]
  }));

  return new Response(
    JSON.stringify({
      request: {
        id: request.id,
        targetLanguage: request.target_language,
        nativeLanguage: request.native_language,
        proficiency: request.proficiency,
        topic: request.topic,
        createdAt: request.created_at
      },
      items
    }),
    {
      headers: { 'Content-Type': 'application/json' }
    }
  );
});
