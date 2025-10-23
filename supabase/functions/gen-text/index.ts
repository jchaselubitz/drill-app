import OpenAI from 'jsr:@openai/openai';
import { corsHeaders } from '../_shared/cors.ts';
import { OpenAiModel } from '../_shared/enums.ts';
import { Langfuse } from 'https://esm.sh/langfuse';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const data = await req.json();
  const modelSelection = data.modelSelection;
  const modelParams = data.modelParams;
  const messages = data.messages;
  const userApiKey = data.userApiKey;

  try {
    const langfuse = new Langfuse({
      secretKey: Deno.env.get('LANGFUSE_SECRET_KEY'),
      publicKey: Deno.env.get('LANGFUSE_PUBLIC_KEY'),
      baseUrl: Deno.env.get('LANGFUSE_HOST'),
    });

    const openai = new OpenAI({
      apiKey: userApiKey ? userApiKey : Deno.env.get('OPENAI_API_KEY'),
    });

    const {
      format,
      presence_penalty = 0,
      frequency_penalty = 0,
      temperature = 0.5,
      max_tokens = 3500,
      stream = false,
    } = modelParams;

    const trace = langfuse.trace({
      name: 'gen-text',
      tags: [Deno.env.get('ENVIRONMENT') || 'undefined env'],
    });

    const generation = trace.generation({
      name: 'chat-completion',
      model: userApiKey ? modelSelection : OpenAiModel.gpt4oMini,
      input: messages,
      metadata: format,
      modelParameters: {
        presence_penalty,
        frequency_penalty,
        temperature,
        max_tokens,
        stream,
      },
    });

    const completion = await openai.chat.completions.create({
      model: userApiKey ? modelSelection : OpenAiModel.gpt4oMini,
      messages: messages,
      response_format: format,
      presence_penalty,
      frequency_penalty,
      temperature,
      max_tokens,
      stream,
    });

    console.log(completion);

    const reply = completion.choices[0].message;

    generation.end({
      output: completion,
    });

    langfuse.on('error', (error) => {
      console.error('gen-text' + error);
    });
    await langfuse.shutdownAsync();

    return new Response(JSON.stringify(reply), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: error }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

//Instructions: https://supabase.com/docs/guides/ai/examples/openai
