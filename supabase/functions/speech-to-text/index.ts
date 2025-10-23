import OpenAI from 'jsr:@openai/openai';
import { corsHeaders } from '../_shared/cors.ts';
import { Uploadable } from 'https://deno.land/x/openai@v4.69.0/core.ts';
import { Langfuse } from 'https://esm.sh/langfuse';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'POST') {
    const langfuse = new Langfuse({
      secretKey: Deno.env.get('LANGFUSE_SECRET_KEY'),
      publicKey: Deno.env.get('LANGFUSE_PUBLIC_KEY'),
      baseUrl: Deno.env.get('LANGFUSE_HOST'),
    });

    const trace = langfuse.trace({
      name: 'speech-to-text',
      tags: [Deno.env.get('ENVIRONMENT') || 'undefined env'],
    });

    const span = trace.span({
      name: 'transcription',
      input: {
        userInput: 'audioFile',
      },
    });

    const data = await req.formData();
    const compressedBlob = data.get('audioFile') as Blob;

    try {
      span.update({
        metadata: {
          httpRoute: '/api/speech-to-text',
        },
      });

      const audioFile = new File([compressedBlob], 'podcast.mp3', { type: 'audio/mpeg' });

      if (!audioFile) {
        throw new Error('No audio file provided');
      }
      const openai = new OpenAI({
        apiKey: Deno.env.get('OPENAI_API_KEY'),
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile as Uploadable,
        model: 'whisper-1',
        response_format: 'verbose_json',
      });
      const resp = { text: transcription.text, language: transcription.language };

      span.end({
        output: {
          resp,
        },
      });

      langfuse.on('error', (error) => {
        console.error('speech-to-text' + error);
      });
      await langfuse.shutdownAsync();

      return new Response(JSON.stringify(resp), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: corsHeaders,
  });
});
