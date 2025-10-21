export interface LessonRequestPayload {
  language: string;
  nativeLanguage: string;
  level: string;
  topic: string;
  library: {
    terms: string[];
    concepts: string[];
  };
}

export interface LessonItemPayload {
  id: string;
  prompt: string;
  suggestedAnswer: string;
  focus: {
    terms: string[];
    concepts: string[];
  };
}

export interface GenerateLessonResponse {
  items: LessonItemPayload[];
  metadata: {
    total: number;
    requestId: string;
  };
}

export interface CorrectionRequestPayload {
  attempt: string;
  reference: string;
  language: string;
  lessonId: string;
  itemId: string;
}

export interface CorrectionResponsePayload {
  corrected: string;
  spellingScore: number;
  grammarScore: number;
  rationale: string;
  highlightRanges?: Array<{ start: number; end: number; type: 'spelling' | 'grammar' }>;
}
