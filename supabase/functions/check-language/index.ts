import OpenAI from 'jsr:@openai/openai';
import { corsHeaders } from '../_shared/cors.ts';
import { OpenAiModel } from '../_shared/enums.ts';
import { ChatCompletionMessageParam } from 'https://deno.land/x/openai@v4.69.0/resources/mod.ts';
import { Langfuse } from 'https://esm.sh/langfuse';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const data = await req.json();
  const format = data.format;
  const text = data.text;
  const snippet = text.slice(0, 20);
  const messages = [
    {
      role: 'system',
      content: 'ISO 639 code as JSON object such as: { "lng": "en" }',
    },
    { role: 'user', content: `what is the language of this text: ${snippet}?` },
  ] as ChatCompletionMessageParam[];

  try {
    const langfuse = new Langfuse({
      secretKey: Deno.env.get('LANGFUSE_SECRET_KEY'),
      publicKey: Deno.env.get('LANGFUSE_PUBLIC_KEY'),
      baseUrl: Deno.env.get('LANGFUSE_HOST'),
    });

    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    const modelParams = {
      format: format,
      presence_penalty: 0,
      frequency_penalty: 0,
      temperature: 1,
      max_tokens: 20,
      stream: false,
    };

    const trace = langfuse.trace({
      name: 'check-language',
      tags: [Deno.env.get('ENVIRONMENT') || 'undefined env'],
    });

    const generation = trace.generation({
      name: 'check-language',
      model: OpenAiModel.gpt4oMini,
      input: messages,
      modelParameters: {
        response_format: modelParams.format,
        presence_penalty: modelParams.presence_penalty,
        frequency_penalty: modelParams.frequency_penalty,
        temperature: modelParams.temperature,
        max_tokens: modelParams.max_tokens,
        stream: false,
      },
    });

    const completion = await openai.chat.completions.create({
      model: OpenAiModel.gpt4oMini,
      messages: messages,
      response_format: modelParams.format,
      presence_penalty: modelParams.presence_penalty,
      frequency_penalty: modelParams.frequency_penalty,
      temperature: modelParams.temperature,
      max_tokens: modelParams.max_tokens,
      stream: false,
    });

    const reply = completion.choices[0].message.content;

    generation.end({
      output: completion,
    });

    langfuse.on('error', (error) => {
      console.error('check-language' + error);
    });
    await langfuse.shutdownAsync();

    return new Response(JSON.stringify(reply), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

//Instructions: https://supabase.com/docs/guides/ai/examples/openai
