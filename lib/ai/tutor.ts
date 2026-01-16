import { GeminiModel, getModel, Languages } from '@/constants';
import {
  type LanguageCode,
  type ReviewResponse,
  reviewSchema,
  type TutorPromptParams,
} from '@/types';

import { generateJSON, generateText } from '../gemini';

const model2_5_lite = getModel(GeminiModel.FLASH_2_5_LITE);
const model3_flash = getModel(GeminiModel.FLASH_3);

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

  const systemPrompt = `You are a language tutor helping a student improve their ${topicLangName}.
Provide a concise and simple writing prompt in ${userLangName}, just as a tutor might when testing a student. The student's current level is ${level} (according to the Common European Framework of Reference for Languages).`;

  const prompt = `Task: Prompt me to write a short paragraph about ${instructions}.
Lower levels should result in shorter, simpler prompts. Higher levels should result in longer, more complicated prompts that include a person or people, a place, and a problem to solve.

Guidelines based on level:
- A1-A2: Keep it very simple and short (2-3 sentences expected). Use basic vocabulary.
- B1-B2: Moderate complexity. The prompt should be longer. Include a person and a simple situation.
- C1-C2: More complex. Include a person, a place, and a problem to solve.

${
  relatedPhraseArray
    ? `If appropriate, incorporate these phrases the student is learning: ${relatedPhraseArray}`
    : ''
}

Return ONLY the prompt text in ${userLangName}, nothing else.`;

  return generateText({ prompt, modelName: model2_5_lite, systemPrompt });
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

  return generateText({ prompt, modelName: model2_5_lite, systemPrompt: '' });
}

export async function reviewParagraph({
  paragraph,
  topicLanguage,
  userLanguage,
  abortSignal,
}: {
  paragraph: string;
  topicLanguage: LanguageCode;
  userLanguage: LanguageCode;
  abortSignal?: AbortSignal;
}): Promise<ReviewResponse> {
  const topicLangName = getLanguageName(topicLanguage);
  const userLangName = getLanguageName(userLanguage);

  const prompt = `You are a ${topicLangName} language tutor. Review the following paragraph written by a student learning ${topicLangName}.

Student's paragraph:
"${paragraph}"`;

  const systemPrompt = `Provide your response as JSON with exactly this structure:
{
  "correction": "The corrected version of the paragraph with proper grammar and vocabulary. Use **bold** to highlight words/phrases you changed.",
  "feedback": [
    {
      "point": "Grammar Concept Name",
      "explanation": "Detailed explanation in ${userLangName} of what was wrong, the specific grammar rule that applies, and how to remember the correct form",
      "negative": true
    }
  ],
  "vocabulary": [
    {
      "nativeText": "Word or phrase in ${userLangName}",
      "targetText": "Translation in ${topicLangName}",
      "nativeLang": "${userLanguage}",
      "targetLang": "${topicLanguage}"
    }
  ]
}

Guidelines:
- Keep the correction as close to the original as possible so the student can see their mistakes
- IMPORTANT: The feedback should cover EVERY correction made to the paragraph. It can also include suggestions that are not corrections.
- Each feedback item should have a "point" (the name of the grammatical concept, e.g., "Subject-Verb Agreement", "Past Tense Formation"), an "explanation" (detailed feedback in ${userLangName}), and a "negative" boolean
- In explanations, explain WHY something is wrong, not just that it is wrong
- Reference specific grammar rules by name in the point field
- Use "negative": true for critiques/corrections and "negative": false for positive reinforcement
- Include 2-5 feedback items covering the most important corrections
- Vocabulary detection: Identify any words or phrases in the student's submission that are written in ${userLangName} (the student's native language). For each detected native language term, include it in the "vocabulary" array with both the native text and its translation in ${topicLangName} (the target language). If no native language words are detected, include an empty array for "vocabulary"
- Each vocabulary item must have "nativeText" (the word/phrase as written in ${userLangName}), "targetText" (the translation in ${topicLangName}), "nativeLang" (set to "${userLanguage}"), and "targetLang" (set to "${topicLanguage}")
- Do not repeat keys in the JSON output.`;

  const response = await generateJSON({
    prompt,
    modelName: model3_flash,
    systemPrompt,
    schema: reviewSchema,
    abortSignal,
  });

  // Parse and validate the response
  try {
    const parsed = JSON.parse(response);
    const validated = reviewSchema.parse(parsed);
    return validated as ReviewResponse;
  } catch (error) {
    console.error('Error parsing or validating review response:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse review response. The AI may have returned an invalid format.');
  }
}
