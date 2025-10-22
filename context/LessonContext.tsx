import React, { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { LessonItem, LessonRequest, LessonSessionState } from '@types/lesson';

const initialState: LessonSessionState = {
  status: 'idle',
  activeLesson: undefined,
  recentScores: [],
  library: {
    terms: [],
    concepts: []
  }
};

type LessonAction =
  | { type: 'START_LESSON'; payload: { request: LessonRequest; items: LessonItem[] } }
  | { type: 'ADVANCE_ITEM'; payload: { index: number; scores: { spelling: number; grammar: number } } }
  | { type: 'ADD_LIBRARY_ITEM'; payload: { category: 'terms' | 'concepts'; value: string; translation?: string } }
  | { type: 'RESET_LESSON' };

function lessonReducer(state: LessonSessionState, action: LessonAction): LessonSessionState {
  switch (action.type) {
    case 'START_LESSON':
      return {
        ...state,
        status: 'in_progress',
        activeLesson: {
          request: action.payload.request,
          items: action.payload.items,
          currentIndex: 0
        },
        recentScores: []
      };
    case 'ADVANCE_ITEM': {
      if (!state.activeLesson) return state;
      const isComplete = action.payload.index >= state.activeLesson.items.length;
      const nextIndex = Math.min(action.payload.index, state.activeLesson.items.length);
      const updatedScores = [
        { spelling: action.payload.scores.spelling, grammar: action.payload.scores.grammar },
        ...state.recentScores
      ].slice(0, 10);
      return {
        ...state,
        activeLesson: {
          ...state.activeLesson,
          currentIndex: nextIndex
        },
        status: isComplete ? 'complete' : state.status,
        recentScores: updatedScores
      };
    }
    case 'ADD_LIBRARY_ITEM': {
      const existing = state.library[action.payload.category];
      if (existing.find((item) => item.value === action.payload.value)) {
        return state;
      }
      return {
        ...state,
        library: {
          ...state.library,
          [action.payload.category]: [
            ...existing,
            {
              value: action.payload.value,
              translation: action.payload.translation,
              focusLevel: 1
            }
          ]
        }
      };
    }
    case 'RESET_LESSON':
      return {
        ...state,
        status: 'idle',
        activeLesson: undefined
      };
    default:
      return state;
  }
}

interface LessonContextValue extends LessonSessionState {
  startLesson: (request: LessonRequest, items: LessonItem[]) => void;
  advanceLesson: (scores: { spelling: number; grammar: number }) => void;
  addLibraryItem: (category: 'terms' | 'concepts', value: string, translation?: string) => void;
  resetLesson: () => void;
}

const LessonContext = createContext<LessonContextValue | undefined>(undefined);

export const LessonProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(lessonReducer, initialState);

  const startLesson = useCallback((request: LessonRequest, items: LessonItem[]) => {
    dispatch({ type: 'START_LESSON', payload: { request, items } });
  }, []);

  const advanceLesson = useCallback(
    (scores: { spelling: number; grammar: number }) => {
      if (!state.activeLesson) return;
      const nextIndex = state.activeLesson.currentIndex + 1;
      dispatch({ type: 'ADVANCE_ITEM', payload: { index: nextIndex, scores } });
    },
    [state.activeLesson]
  );

  const addLibraryItem = useCallback(
    (category: 'terms' | 'concepts', value: string, translation?: string) => {
      dispatch({ type: 'ADD_LIBRARY_ITEM', payload: { category, value, translation } });
    },
    []
  );

  const resetLesson = useCallback(() => {
    dispatch({ type: 'RESET_LESSON' });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      startLesson,
      advanceLesson,
      addLibraryItem,
      resetLesson
    }),
    [state, startLesson, advanceLesson, addLibraryItem, resetLesson]
  );

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
};

export const useLessonContext = (): LessonContextValue => {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLessonContext must be used within a LessonProvider');
  }
  return context;
};
