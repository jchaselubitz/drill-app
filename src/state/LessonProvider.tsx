import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type {
  CorrectionFeedback,
  LessonItem,
  LessonProgressMetrics,
  LessonRequest,
  LessonState
} from '@/types';

interface LessonContextValue extends LessonState {
  setRequest: (request: LessonRequest) => void;
  enqueueItems: (items: LessonItem[]) => void;
  advance: (feedback?: CorrectionFeedback) => void;
  reset: () => void;
}

const createDefaultMetrics = (): LessonProgressMetrics => ({
  spellingScore: 0,
  grammarScore: 0,
  averageSpellingScore: 0,
  averageGrammarScore: 0
});

const initialState: LessonState = {
  request: null,
  queue: [],
  currentIndex: 0,
  metrics: createDefaultMetrics(),
  lastUpdated: null
};

type Action =
  | { type: 'SET_REQUEST'; payload: LessonRequest }
  | { type: 'ENQUEUE_ITEMS'; payload: LessonItem[] }
  | { type: 'ADVANCE'; payload?: CorrectionFeedback }
  | { type: 'RESET' };

function reducer(state: LessonState, action: Action): LessonState {
  switch (action.type) {
    case 'SET_REQUEST':
      return {
        ...state,
        request: action.payload,
        queue: [],
        currentIndex: 0,
        metrics: createDefaultMetrics(),
        lastUpdated: new Date().toISOString()
      };
    case 'ENQUEUE_ITEMS':
      return {
        ...state,
        queue: [...state.queue, ...action.payload],
        lastUpdated: new Date().toISOString()
      };
    case 'ADVANCE':
      return {
        ...state,
        currentIndex: Math.min(state.currentIndex + 1, state.queue.length),
        metrics: action.payload
          ? {
              spellingScore: action.payload.spellingScore,
              grammarScore: action.payload.grammarScore,
              averageSpellingScore: (state.metrics.averageSpellingScore + action.payload.spellingScore) / 2,
              averageGrammarScore: (state.metrics.averageGrammarScore + action.payload.grammarScore) / 2
            }
          : state.metrics,
        lastUpdated: new Date().toISOString()
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const LessonContext = createContext<LessonContextValue | undefined>(undefined);

export const LessonProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<LessonContextValue>(
    () => ({
      ...state,
      setRequest: (request) => dispatch({ type: 'SET_REQUEST', payload: request }),
      enqueueItems: (items) => dispatch({ type: 'ENQUEUE_ITEMS', payload: items }),
      advance: (feedback) => dispatch({ type: 'ADVANCE', payload: feedback }),
      reset: () => dispatch({ type: 'RESET' })
    }),
    [state]
  );

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
};

export function useLesson() {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error('useLesson must be used within a LessonProvider');
  }
  return context;
}
