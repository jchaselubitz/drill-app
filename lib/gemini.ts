import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function initializeGemini(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
}

function getGenerativeModel(modelName: string) {
  if (!genAI) {
    throw new Error('Gemini not initialized. Call initializeGemini first.');
  }
  return genAI.getGenerativeModel({ model: modelName });
}

export async function generateText(prompt: string, modelName: string): Promise<string> {
  const model = getGenerativeModel(modelName);
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateJSON<T>(prompt: string, modelName: string): Promise<T> {
  const model = getGenerativeModel(modelName);
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
  const text = result.response.text();
  return JSON.parse(text) as T;
}

export async function chat(systemPrompt: string, userMessages: string[], modelName: string): Promise<string> {
  const model = getGenerativeModel(modelName);
  const fullPrompt = `${systemPrompt}\n\n${userMessages.join('\n')}`;
  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}
