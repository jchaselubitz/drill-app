import { GeminiModel, getModel, Languages } from '@/constants';
import type { CEFRLevel, LanguageCode } from '@/types';

import { generateText } from '../gemini';

const model = getModel(GeminiModel.FLASH_2_5_LITE);

function getLanguageName(code: LanguageCode): string {
  return Languages.find((l) => l.code === code)?.name ?? code;
}

export interface VocabularyItem {
  primary: string;
  secondary: string;
}

export interface GenerateLearningLanguagePromptParams {
  topic: string;
  vocabulary: VocabularyItem[];
  learningLanguage: LanguageCode;
  userLanguage: LanguageCode;
  level: CEFRLevel;
  instructions?: string;
}

/**
 * Generates a writing prompt IN the learning language (target language)
 * that incorporates vocabulary from the associated phrase set.
 *
 * Example: For a German learner with topic "Home maintenance",
 * this generates a prompt in German that asks them to use specific
 * vocabulary words they've been studying.
 */
export async function generateLearningLanguagePrompt({
  topic,
  vocabulary,
  learningLanguage,
  userLanguage,
  level,
  instructions,
}: GenerateLearningLanguagePromptParams): Promise<string> {
  const learningLangName = getLanguageName(learningLanguage);
  const userLangName = getLanguageName(userLanguage);

  // Format vocabulary list for the prompt
  const vocabularyList = vocabulary
    .slice(0, 10) // Limit to 10 items for manageable prompts
    .map((v) => `- ${v.primary} (${v.secondary})`)
    .join('\n');

  const systemPrompt = `You are a language tutor helping a student practice writing in ${learningLangName}.
The student's native language is ${userLangName} and their current level is ${level} (CEFR).

Your task is to create a writing prompt that is ENTIRELY in ${learningLangName}.
The prompt should encourage the student to use specific vocabulary words they have been studying.`;

  const prompt = `Create a writing prompt in ${learningLangName} about "${instructions || topic}".

The student has been studying these vocabulary items:
${vocabularyList}

Requirements:
1. Write the ENTIRE prompt in ${learningLangName} - no ${userLangName} except for vocabulary hints
2. The prompt should naturally encourage using at least 5-7 of the vocabulary items
3. Include a brief instruction (in ${learningLangName}) listing which vocabulary words to incorporate
4. Match the complexity to ${level} CEFR level:
   - A1-A2: Simple scenario, basic sentence structures expected
   - B1-B2: More detailed scenario, compound sentences expected
   - C1-C2: Complex scenario with nuance, sophisticated structures expected
5. Make it engaging and practical - something the student might actually need to write about

Format the prompt as:
[Main writing scenario/question in ${learningLangName}]

[Instruction to use these words: list 5-7 vocabulary items in ${learningLangName}]

Return ONLY the prompt text in ${learningLangName}, nothing else.`;

  return generateText({ prompt, modelName: model, systemPrompt });
}

/**
 * Generates a new prompt in the user's native language (original behavior)
 * but enhanced to incorporate vocabulary from an associated phrase set.
 */
export async function generateUserLanguagePromptWithVocabulary({
  topic,
  vocabulary,
  learningLanguage,
  userLanguage,
  level,
  instructions,
}: GenerateLearningLanguagePromptParams): Promise<string> {
  const learningLangName = getLanguageName(learningLanguage);
  const userLangName = getLanguageName(userLanguage);

  // Extract just the learning language terms
  const vocabTerms = vocabulary.slice(0, 10).map((v) => v.primary);
  const vocabList = vocabTerms.join(', ');

  const systemPrompt = `You are a language tutor helping a student improve their ${learningLangName}.
Provide a concise and simple writing prompt in ${userLangName}, just as a tutor might when testing a student.
The student's current level is ${level} (according to the Common European Framework of Reference for Languages).`;

  const prompt = `Task: Prompt me to write a short paragraph about ${instructions || topic}.
Lower levels should result in shorter, simpler prompts. Higher levels should result in longer, more complicated prompts that include a person or people, a place, and a problem to solve.

Guidelines based on level:
- A1-A2: Keep it very simple and short (2-3 sentences expected). Use basic vocabulary.
- B1-B2: Moderate complexity. The prompt should be longer. Include a person and a simple situation.
- C1-C2: More complex. Include a person, a place, and a problem to solve.

IMPORTANT: Incorporate these ${learningLangName} vocabulary words the student is studying into your prompt:
${vocabList}

Encourage the student to use these specific words in their response.

Return ONLY the prompt text in ${userLangName}, nothing else.`;

  return generateText({ prompt, modelName: model, systemPrompt });
}
