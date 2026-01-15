import { GeminiModel, getModel, Languages } from '@/constants';
import { TranslationResponse, translationResponseSchema } from '@/types';

import { generateJSON } from '../gemini';

const model = getModel(GeminiModel.FLASH_2_5_LITE);

export async function translatePhrase({
  text,
  targetLanguage,
}: {
  text: string;
  targetLanguage: string;
}): Promise<TranslationResponse> {
  const targetLangName = Languages.find((l) => l.code === targetLanguage)?.name ?? targetLanguage;

  const systemPrompt = `You are a translator. The user wants a translation. Return a JSON object with:
- input_text: the original text provided (exactly as given)
- input_lang: ISO 639-1 code of the input language (e.g., "en", "es", "de")
- output_text: the translated text
- output_lang: ISO 639-1 code of the output language (e.g., "en", "es", "de")`;

  const prompt = `Translate: "${text}"
(Translate to ${targetLangName}.)`;

  const response = await generateJSON({
    prompt,
    modelName: model,
    systemPrompt,
    schema: translationResponseSchema,
  });

  try {
    const parsed = JSON.parse(response);
    const validated = translationResponseSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('Error parsing translation response:', error);
    console.error('Raw response:', response);
    throw new Error('Failed to parse translation response');
  }
}
