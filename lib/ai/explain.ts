import { z } from 'zod';

import { GeminiModel, getModel, Languages } from '@/constants';
import type { ExplanationResponse, LanguageCode } from '@/types';

import { generateJSON } from '../gemini';

const MODEL = getModel(GeminiModel.FLASH_3);

const explanationSchema = z.object({
  type: z.enum(['message', 'translation', 'list']),
  data: z.string(),
});

function getLanguageName(code: LanguageCode): string {
  return Languages.find((l) => l.code === code)?.name ?? code;
}

export async function generateExplanation({
  subjectText,
  request,
  userLanguage,
}: {
  subjectText: string;
  request: string;
  userLanguage: LanguageCode;
}): Promise<ExplanationResponse> {
  const userLangName = getLanguageName(userLanguage);

  const prompt = `Explain the following in ${userLangName}:

Subject: "${subjectText}"
Request: ${request}`;

  const systemPrompt = `Provide your response as JSON with this structure:
{
  "type": "message" | "translation" | "list",
  "data": "Your explanation here"
}

Choose the type based on what best fits the response:
- "message": For general explanations or grammar concepts
- "translation": For direct translations or meanings
- "list": For vocabulary lists or multiple examples (use bullet points in data)

Keep the explanation clear and educational.`;

  const response = await generateJSON({
    prompt,
    modelName: MODEL,
    systemPrompt,
    schema: explanationSchema,
  });
  return JSON.parse(response) as ExplanationResponse;
}
