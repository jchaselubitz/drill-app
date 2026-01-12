import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

export function initializeGemini(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });
}

export function getModel(): GenerativeModel {
  if (!model) {
    throw new Error('Gemini not initialized. Call initializeGemini first.');
  }
  return model;
}

export async function generateText(prompt: string): Promise<string> {
  const geminiModel = getModel();
  const result = await geminiModel.generateContent(prompt);
  return result.response.text();
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const geminiModel = getModel();
  const result = await geminiModel.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });
  const text = result.response.text();
  return JSON.parse(text) as T;
}

export async function chat(systemPrompt: string, userMessages: string[]): Promise<string> {
  const geminiModel = getModel();
  const fullPrompt = `${systemPrompt}\n\n${userMessages.join('\n')}`;
  const result = await geminiModel.generateContent(fullPrompt);
  return result.response.text();
}
