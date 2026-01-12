import { GeminiModel, getModel, Languages } from '@/constants';
import type { LanguageCode, ReviewResponse } from '@/types';
import { generateJSON } from '../gemini';

const MODEL = getModel(GeminiModel.FLASH_3);

function getLanguageName(code: LanguageCode): string {
  return Languages.find((l) => l.code === code)?.name ?? code;
}

export async function reviewParagraph({
  paragraph,
  topicLanguage,
  userLanguage,
}: {
  paragraph: string;
  topicLanguage: LanguageCode;
  userLanguage: LanguageCode;
}): Promise<ReviewResponse> {
  const topicLangName = getLanguageName(topicLanguage);
  const userLangName = getLanguageName(userLanguage);

  const prompt = `You are a ${topicLangName} language tutor. Review the following paragraph written by a student learning ${topicLangName}.

Student's paragraph:
"${paragraph}"

Provide your response as JSON with exactly this structure:
{
  "correction": "The corrected version of the paragraph with proper grammar and vocabulary. Use **bold** to highlight words/phrases you changed.",
  "feedback": "Bullet-point feedback in ${userLangName} explaining: 1) What was wrong 2) The specific grammar rules that apply 3) How to remember the correct form"
}

Guidelines:
- Keep the correction as close to the original as possible so the student can see their mistakes
- In feedback, explain WHY something is wrong, not just that it is wrong
- Reference specific grammar rules by name when applicable
- Be encouraging but honest`;

  return generateJSON<ReviewResponse>(prompt, MODEL);
}
