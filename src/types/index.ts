export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LessonRequest {
  id: string;
  targetLanguage: string;
  proficiency: ProficiencyLevel;
  topic: string;
  nativeLanguage: string;
  createdAt: string;
}

export interface LessonItem {
  id: string;
  prompt: string;
  expectedAnswer: string;
  focusWords: string[];
  focusConcepts: string[];
}

export interface LessonProgressMetrics {
  spellingScore: number;
  grammarScore: number;
  averageSpellingScore: number;
  averageGrammarScore: number;
}

export interface LessonState {
  request: LessonRequest | null;
  queue: LessonItem[];
  currentIndex: number;
  metrics: LessonProgressMetrics;
  lastUpdated: string | null;
}

export interface CorrectionFeedback {
  id: string;
  userAnswer: string;
  correctedAnswer: string;
  spellingScore: number;
  grammarScore: number;
  notes?: string;
  focusWords: string[];
  focusConcepts: string[];
}

export interface LibraryItemBase {
  id: string;
  createdAt: string;
  lessonRequestId?: string;
  frequency: 'low' | 'medium' | 'high';
}

export interface PhraseLibraryItem extends LibraryItemBase {
  type: 'phrase';
  content: string;
  translation?: string;
}

export interface ConceptLibraryItem extends LibraryItemBase {
  type: 'concept';
  concept: string;
  description?: string;
}

export type LibraryItem = PhraseLibraryItem | ConceptLibraryItem;

export interface LibraryState {
  phrases: PhraseLibraryItem[];
  concepts: ConceptLibraryItem[];
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  nativeLanguage: string;
}

export interface ApiError {
  message: string;
  status?: number;
}
