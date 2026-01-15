import { GeminiModel, getModel, Languages } from '@/constants';
import { type LanguageCode, type SkillAnalysisResponse, skillAnalysisSchema } from '@/types';

import { generateJSON } from '../gemini';

const model = getModel(GeminiModel.THREE_PRO);

function getLanguageName(code: LanguageCode): string {
  return Languages.find((l) => l.code === code)?.name ?? code;
}

export async function analyzeSkills({
  feedbackItems,
  topicLanguage,
  userLanguage,
}: {
  feedbackItems: Array<{ id: string; point: string; explanation: string }>;
  topicLanguage: LanguageCode;
  userLanguage: LanguageCode;
}): Promise<SkillAnalysisResponse> {
  const topicLangName = getLanguageName(topicLanguage);
  const userLangName = getLanguageName(userLanguage);

  const feedbackList = feedbackItems
    .map((f, i) => `[${i}] Point: "${f.point}" - Explanation: "${f.explanation}"`)
    .join('\n');

  const prompt = `Analyze the following ${topicLangName} language learning feedback items to identify skill weaknesses. Each feedback item represents a mistake or area for improvement from a student's writing practice.

Feedback items:
${feedbackList}

Identify patterns and group similar issues into distinct skills. For each skill:
1. Give it a clear, normalized name (e.g., "Subject-Verb Agreement", "Article Usage", "Preposition Selection")
2. Categorize it appropriately
3. Rank its severity (1=mild, 2=moderate, 3=severe) based on frequency and impact on comprehension
4. Write a helpful description in ${userLangName} explaining the weakness and how to improve
5. List the indices of related feedback items`;

  const systemPrompt = `You are an expert language learning analyst. Analyze feedback patterns to identify skill weaknesses.

Respond with JSON in this exact format:
{
  "skills": [
    {
      "name": "Skill Name (normalized, title case)",
      "category": "grammar|spelling|vocabulary|style|punctuation|sentence_structure|tone|idioms",
      "rank": 1-3,
      "description": "Description in ${userLangName}",
      "relatedFeedbackIndices": [0, 2, 5]
    }
  ]
}

Guidelines:
- Combine similar feedback into unified skills (don't create duplicate skills)
- Use consistent naming (e.g., always "Subject-Verb Agreement" not variations)
- Rank based on: frequency of occurrence AND severity of impact on comprehension
- Descriptions should be actionable and encouraging
- Include ALL relevant feedback indices for each skill
- Categories must be exactly one of: grammar, spelling, vocabulary, style, punctuation, sentence_structure, tone, idioms`;

  const response = await generateJSON({
    prompt,
    modelName: model,
    systemPrompt,
    schema: skillAnalysisSchema,
  });

  try {
    const parsed = JSON.parse(response);
    const validated = skillAnalysisSchema.parse(parsed);
    return validated as SkillAnalysisResponse;
  } catch (error) {
    console.error('Error parsing skill analysis response:', error);
    console.error('Raw response:', response);
    throw new Error(
      'Failed to parse skill analysis response. The AI may have returned an invalid format.'
    );
  }
}
