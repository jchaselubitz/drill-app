import Constants from 'expo-constants';
import { z } from 'zod';

import { hasAiConsent, requireAiConsent } from './ai/consent';
import { drillAiUrl, forgetDrillAiToken, getDrillAiToken } from './drillAiSession';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

type Message = { role: 'system' | 'user'; content: string };

type CompletionRequest = {
  model: string;
  messages: Message[];
  provider?: { require_parameters?: boolean; zdr?: true; data_collection?: 'deny' };
  response_format?: {
    type: 'json_schema';
    json_schema: { name: string; strict: boolean; schema: z.core.JSONSchema.JSONSchema };
  };
};

type CompletionResponse = {
  choices?: { message?: { content?: string | null }; error?: unknown }[];
  error?: unknown;
};

const waitForSpeech: (() => void)[] = [];
let activeSpeech = 0;

async function withSpeechSlot(
  send: () => Promise<Response>,
  signal?: AbortSignal
): Promise<Response> {
  if (activeSpeech >= 3) {
    await new Promise<void>((resolve) => waitForSpeech.push(resolve));
  } else {
    activeSpeech++;
  }
  try {
    if (signal?.aborted) {
      const error = new Error('Speech request was cancelled');
      error.name = 'AbortError';
      throw error;
    }
    return await send();
  } finally {
    const next = waitForSpeech.shift();
    if (next) next();
    else activeSpeech--;
  }
}

const appStoreBuild = Constants.expoConfig?.extra?.appStoreBuild === true;
const openRouterApiKey = Constants.expoConfig?.extra?.openRouterApiKey as string | undefined;

export function requiresAiConsent(): boolean {
  return appStoreBuild || Boolean(drillAiUrl);
}

export function isAiConfigured(): boolean {
  return Boolean(drillAiUrl || openRouterApiKey);
}

export async function canRunAiInBackground(): Promise<boolean> {
  return !requiresAiConsent() || (await hasAiConsent());
}

export async function requestOpenRouter<T extends object>(
  endpoint: '/chat/completions' | '/audio/speech',
  request: T & Pick<CompletionRequest, 'provider'>,
  signal?: AbortSignal
): Promise<Response> {
  const body = JSON.stringify(
    appStoreBuild
      ? {
          ...request,
          ...(endpoint === '/chat/completions' && { max_tokens: 8192 }),
          provider: { ...request.provider, zdr: true, data_collection: 'deny' },
        }
      : request
  );
  const send = (url: string, token: string) =>
    fetch(url + endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body,
      signal,
    });

  let response: Response;
  if (drillAiUrl) {
    await requireAiConsent();
    const hostedRequest = async () => {
      const sendWithConsent = async (token: string) => {
        if (!(await hasAiConsent())) throw new Error('Third-party AI access is off in Settings.');
        return send(`${drillAiUrl}/v1`, token);
      };
      const token = await getDrillAiToken();
      const initialResponse = await sendWithConsent(token);
      if (initialResponse.status !== 401) return initialResponse;
      forgetDrillAiToken(token);
      return sendWithConsent(await getDrillAiToken());
    };
    response =
      endpoint === '/audio/speech'
        ? await withSpeechSlot(hostedRequest, signal)
        : await hostedRequest();
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const message =
        typeof payload?.error === 'string' ? payload.error : 'Drill’s AI request failed';
      throw new Error(message);
    }
  } else if (openRouterApiKey) {
    const sendDirect = async () => {
      if (appStoreBuild) await requireAiConsent();
      return send(OPENROUTER_API_URL, openRouterApiKey);
    };
    response =
      appStoreBuild && endpoint === '/audio/speech'
        ? await withSpeechSlot(sendDirect, signal)
        : await sendDirect();
    if (!response.ok) {
      throw new Error(`OpenRouter request failed (HTTP ${response.status})`);
    }
  } else {
    throw new Error('Drill’s AI service is unavailable.');
  }
  return response;
}

async function complete(request: CompletionRequest, signal?: AbortSignal): Promise<string> {
  const response = await requestOpenRouter('/chat/completions', request, signal);
  const result = (await response.json()) as CompletionResponse;
  const choice = result.choices?.[0];
  if (result.error || choice?.error) {
    throw new Error('OpenRouter returned a completion error');
  }
  if (!choice?.message?.content) {
    throw new Error('OpenRouter returned no response text');
  }

  return choice.message.content;
}

function createMessages(prompt: string, systemPrompt?: string): Message[] {
  const message: Message = { role: 'user', content: prompt };
  return systemPrompt ? [{ role: 'system', content: systemPrompt }, message] : [message];
}

export async function generateText({
  prompt,
  modelName,
  systemPrompt,
}: {
  prompt: string;
  modelName: string;
  systemPrompt?: string;
}): Promise<string> {
  try {
    return await complete({ model: modelName, messages: createMessages(prompt, systemPrompt) });
  } catch (error) {
    if (requiresAiConsent()) throw error;
    console.error('Error generating text:', error);
    return '';
  }
}

export async function generateJSON({
  prompt,
  modelName,
  systemPrompt,
  schema,
  abortSignal,
}: {
  prompt: string;
  modelName: string;
  systemPrompt: string;
  schema: z.ZodSchema;
  abortSignal?: AbortSignal;
}): Promise<string> {
  // OpenRouter accepts a schema object without the dialect declaration.
  const jsonSchema = z.toJSONSchema(schema, { target: 'draft-7' });
  delete jsonSchema.$schema;

  return complete(
    {
      model: modelName,
      messages: createMessages(prompt, systemPrompt),
      provider: { require_parameters: true },
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'drill_response', strict: true, schema: jsonSchema },
      },
    },
    abortSignal
  );
}
