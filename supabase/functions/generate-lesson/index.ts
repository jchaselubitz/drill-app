import { serve } from 'https://deno.land/std@0.202.0/http/server.ts';
import { corsHeaders } from 'https://deno.land/x/supabase_functions@v1.4.0/utils/cors.ts';
import { createLessonFromProvider } from '../_shared/openai.ts';
import { GenerateLessonResponse, LessonRequestPayload } from '../_shared/types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as LessonRequestPayload;
    const { items } = await createLessonFromProvider(payload);

    const body: GenerateLessonResponse = {
      items,
      metadata: {
        total: items.length,
        requestId: crypto.randomUUID()
      }
    };

    return new Response(JSON.stringify(body), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to generate lesson', details: `${error}` }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
