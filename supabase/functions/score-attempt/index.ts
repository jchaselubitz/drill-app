import { serve } from 'https://deno.land/std@0.202.0/http/server.ts';
import { corsHeaders } from 'https://deno.land/x/supabase_functions@v1.4.0/utils/cors.ts';
import { scoreAttemptWithProvider } from '../_shared/openai.ts';
import { CorrectionRequestPayload } from '../_shared/types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as CorrectionRequestPayload;
    const { data } = await scoreAttemptWithProvider(payload);

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Failed to score attempt', details: `${error}` }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});
