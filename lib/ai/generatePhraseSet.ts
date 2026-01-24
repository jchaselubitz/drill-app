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
  phraseType = 'phrases',
}: GeneratePhraseSetParams): Promise<GeneratedPhrase[]> {
  const primaryLangName = getLanguageName(primaryLanguage);
  const secondaryLangName = getLanguageName(secondaryLanguage);

  const existingPhrasesSection = existingPhrases?.length
    ? `\nIMPORTANT: The following phrases already exist in this set. Do NOT repeat any of these:
${existingPhrases.map((p) => `- ${p}`).join('\n')}

Generate NEW phrases that are different but related to the same topic.`
    : '';

  // Build type-specific instructions
  let typeInstructions = '';
  let typeExample = '';

  if (phraseType === 'words') {
    typeInstructions = `Generate single WORDS with their definite articles (e.g., "der Tisch", "la mesa", "le chat").
- For nouns, ALWAYS include the appropriate definite article (the, der/die/das, el/la, le/la, etc.)
- Focus on concrete vocabulary items
- Each entry should be a single word with its article, not a phrase or sentence`;
    typeExample = 'For German: "der Apfel" (the apple), "die Katze" (the cat), "das Haus" (the house)';
  } else if (phraseType === 'phrases') {
    typeInstructions = `Generate short PHRASES or common expressions (2-5 words).
- Focus on useful expressions, collocations, or short idiomatic phrases
- Not full sentences, but meaningful multi-word units`;
    typeExample = 'Examples: "thank you very much", "at the moment", "on the other hand"';
  } else {
    typeInstructions = `Generate complete SENTENCES.
- Each entry should be a full, grammatically complete sentence
- Make sentences practical and useful for everyday conversation
- Vary sentence structure and length appropriately for the level`;
    typeExample = 'Examples: "I would like to order a coffee", "The weather is beautiful today"';
  }

  const systemPrompt = `You are a language learning assistant helping a student study ${primaryLangName} at CEFR level ${level}.
Generate vocabulary appropriate for the student's level.

Respond ONLY with valid JSON matching this exact structure:
{
  "phrases": [
    {
      "primary": "item in ${primaryLangName}",
      "secondary": "translation in ${secondaryLangName}",
      "partOfSpeech": "noun/verb/adjective/adverb/phrase/etc"
    }
  ]
}

TYPE OF CONTENT TO GENERATE:
${typeInstructions}
${typeExample}

Guidelines based on level:
- A1-A2: Basic vocabulary, common words, simple phrases. Shorter sentences.
- B1-B2: Intermediate vocabulary, compound words, idiomatic phrases.
- C1-C2: Advanced vocabulary, nuanced expressions, complex phrases.

The "primary" field should contain the ${primaryLangName} item (the language being studied).
The "secondary" field should contain the ${secondaryLangName} translation (the student's native language).`;

  const prompt = `Generate ${count} ${primaryLangName} ${phraseType} about: "${topic}"

Remember to follow the ${phraseType} format specified above.
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
