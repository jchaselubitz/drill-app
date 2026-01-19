import { GeminiModel, getModel, Languages } from '@/constants';
import {
  type GeneratedPhrase,
  type GeneratePhraseSetParams,
  type LanguageCode,
  phraseSetSchema,
} from '@/types';

import { generateJSON } from '../gemini';

const model = getModel(GeminiModel.FLASH_3);

function getLanguageName(code: LanguageCode): string {
  return Languages.find((l) => l.code === code)?.name ?? code;
}

export async function generatePhraseSet({
  topic,
  primaryLanguage,
  secondaryLanguage,
  level,
  count = 20,
  existingPhrases,
}: GeneratePhraseSetParams): Promise<GeneratedPhrase[]> {
  const primaryLangName = getLanguageName(primaryLanguage);
  const secondaryLangName = getLanguageName(secondaryLanguage);

  const existingPhrasesSection = existingPhrases?.length
    ? `\nIMPORTANT: The following phrases already exist in this set. Do NOT repeat any of these:
${existingPhrases.map((p) => `- ${p}`).join('\n')}

Generate NEW phrases that are different but related to the same topic.`
    : '';

  const systemPrompt = `You are a language learning assistant helping a student study ${primaryLangName} at CEFR level ${level}.
Generate vocabulary and phrases appropriate for the student's level.

Respond ONLY with valid JSON matching this exact structure:
{
  "phrases": [
    {
      "primary": "phrase in ${primaryLangName}",
      "secondary": "translation in ${secondaryLangName}",
      "partOfSpeech": "noun/verb/adjective/adverb/phrase/etc"
    }
  ]
}

Guidelines based on level:
- A1-A2: Basic vocabulary, common words, simple phrases. Shorter sentences.
- B1-B2: Intermediate vocabulary, compound words, idiomatic phrases.
- C1-C2: Advanced vocabulary, nuanced expressions, complex phrases.

The "primary" field should contain the ${primaryLangName} phrase (the language being studied).
The "secondary" field should contain the ${secondaryLangName} translation (the student's native language).`;

  const prompt = `Generate ${count} ${primaryLangName} vocabulary items or phrases about: "${topic}"

Consider the topic and determine whether to generate:
- Single words (for concrete topics like "kitchen items", "animals", "colors")
- Short phrases or sentences (for abstract topics like "expressing gratitude", "making requests")

Match the complexity to CEFR level ${level}.${existingPhrasesSection}`;

  const response = await generateJSON({
    prompt,
    modelName: model,
    systemPrompt,
    schema: phraseSetSchema,
  });

  try {
    const parsed = JSON.parse(response);
    const validated = phraseSetSchema.parse(parsed);
    return validated.phrases;
  } catch (error) {
    console.error('Error parsing phrase set response:', error);
    console.error('Raw response:', response);
    throw new Error(
      'Failed to parse phrase set response. The AI may have returned an invalid format.'
    );
  }
}
