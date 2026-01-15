import { GoogleGenAI } from '@google/genai';
import Constants from 'expo-constants';
import { z } from 'zod';

const genAI = new GoogleGenAI({ apiKey: Constants.expoConfig?.extra?.geminiApiKey as string });

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
    const response = await genAI.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      ...(systemPrompt && {
        config: {
          systemInstruction: systemPrompt,
        },
      }),
    });
    if (!response) {
      throw new Error('No response from Gemini');
    }
    return response.text ?? '';
  } catch (error) {
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
  const jsonSchema = z.toJSONSchema(schema);
  const result = await genAI.models.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    model: modelName,
    config: {
      responseMimeType: 'application/json',
      systemInstruction: systemPrompt,
      responseJsonSchema: jsonSchema,
      abortSignal,
    },
  });
  const text = result.text ?? '';
  if (!text) {
    throw new Error('No response from Gemini');
  }
  return text;
}

export async function chat(
  systemPrompt: string,
  userMessages: string[],
  modelName: string
): Promise<string> {
  const fullPrompt = userMessages.map((message) => ({ role: 'user', parts: [{ text: message }] }));
  const result = await genAI.models.generateContent({
    model: modelName,
    contents: fullPrompt,
    config: {
      systemInstruction: systemPrompt,
    },
  });
  const text = result.text ?? '';
  if (!text) {
    throw new Error('No response from Gemini');
  }
  return text;
}
