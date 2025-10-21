import { serve } from 'https://deno.land/std@0.202.0/http/server.ts';
import { corsHeaders } from 'https://deno.land/x/supabase_functions@v1.4.0/utils/cors.ts';

interface LibrarySyncPayload {
  userId: string;
  terms: Array<{ value: string; translation?: string; focusLevel: number }>;
  concepts: Array<{ value: string; focusLevel: number }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as LibrarySyncPayload;
    console.log('library-sync payload', payload);

    return new Response(JSON.stringify({ status: 'queued' }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 202
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to sync library', details: `${error}` }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
