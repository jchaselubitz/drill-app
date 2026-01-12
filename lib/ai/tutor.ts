import { GeminiModel, getModel, Languages } from '@/constants';
import type { LanguageCode, TutorPromptParams } from '@/types';
import { generateText } from '../gemini';

const MODEL = getModel(GeminiModel.FLASH_2_0);

function getLanguageName(code: LanguageCode): string {
  return Languages.find((l) => l.code === code)?.name ?? code;
}

export async function generateTutorPrompt({
  relatedPhrases,
  userLanguage,
  topicLanguage,
  level,
  instructions,
}: TutorPromptParams): Promise<string> {
  const userLangName = getLanguageName(userLanguage);
  const topicLangName = getLanguageName(topicLanguage);
  const relatedPhraseArray = relatedPhrases.join(', ');

  const prompt = `You are a language tutor helping a student improve their ${topicLangName}.
Provide a concise and simple writing prompt in ${userLangName}, just as a tutor might when testing a student.

The student's current level is ${level} (according to the Common European Framework of Reference for Languages).

Task: Create a prompt asking the student to write a short paragraph about ${instructions}.

Guidelines based on level:
- A1-A2: Keep it very simple and short (2-3 sentences expected). Use basic vocabulary.
- B1-B2: Moderate complexity. Include a person and a simple situation.
- C1-C2: More complex. Include a person, a place, and a problem to solve.

${
  relatedPhraseArray
    ? `If appropriate, incorporate these phrases the student is learning: ${relatedPhraseArray}`
    : ''
}

Return ONLY the prompt text in ${userLangName}, nothing else.`;

  return generateText(prompt, MODEL);
}

export async function changePromptLength({
  promptText,
  length,
}: {
  promptText: string;
  length: 'shorter' | 'longer';
}): Promise<string> {
  const prompt = `I have this writing prompt: "${promptText}"

Make it ${
    length === 'shorter' ? 'two sentences shorter' : 'two sentences longer'
  } while keeping the same structure and subject matter.

Return ONLY the modified prompt text, nothing else.`;

  return generateText(prompt, MODEL);
}
