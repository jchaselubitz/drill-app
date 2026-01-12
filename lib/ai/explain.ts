import { generateJSON } from '../gemini';
import type { ExplanationResponse, LanguageCode } from '@/types';
import { GeminiModel, getModel, Languages } from '@/constants';

const MODEL = getModel(GeminiModel.FLASH_3);

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
Request: ${request}

Provide your response as JSON with this structure:
{
  "type": "message" | "translation" | "list",
  "data": "Your explanation here"
}

Choose the type based on what best fits the response:
- "message": For general explanations or grammar concepts
- "translation": For direct translations or meanings
- "list": For vocabulary lists or multiple examples (use bullet points in data)

Keep the explanation clear and educational.`;

  return generateJSON<ExplanationResponse>(prompt, MODEL);
}
