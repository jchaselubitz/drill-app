export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LessonRequest {
  language: string;
  nativeLanguage: string;
  level: ProficiencyLevel;
  topic: string;
}

export interface LessonItem {
  id: string;
  prompt: string;
  suggestedAnswer: string;
  focus?: {
    terms?: string[];
    concepts?: string[];
  };
}

export interface LessonSession {
  request: LessonRequest;
  items: LessonItem[];
  currentIndex: number;
}

export interface LibraryEntry {
  value: string;
  translation?: string;
  focusLevel: number;
}

export interface LessonSessionState {
  status: 'idle' | 'in_progress' | 'complete';
  activeLesson?: LessonSession;
  recentScores: { spelling: number; grammar: number }[];
  library: {
    terms: LibraryEntry[];
    concepts: LibraryEntry[];
  };
}
