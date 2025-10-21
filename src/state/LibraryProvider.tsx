import React, { createContext, useContext, useMemo, useReducer } from 'react';
import type { ConceptLibraryItem, LibraryItem, LibraryState, PhraseLibraryItem } from '@/types';

type LibraryAction =
  | { type: 'UPSERT_PHRASE'; payload: PhraseLibraryItem }
  | { type: 'UPSERT_CONCEPT'; payload: ConceptLibraryItem }
  | { type: 'REMOVE'; payload: { id: string; category: 'phrase' | 'concept' } }
  | { type: 'RESET' };

const initialState: LibraryState = {
  phrases: [],
  concepts: []
};

interface LibraryContextValue extends LibraryState {
  upsertItem: (item: LibraryItem) => void;
  removeItem: (id: string, category: 'phrase' | 'concept') => void;
  reset: () => void;
}

function reducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'UPSERT_PHRASE':
      return {
        ...state,
        phrases: upsert(state.phrases, action.payload)
      };
    case 'UPSERT_CONCEPT':
      return {
        ...state,
        concepts: upsert(state.concepts, action.payload)
      };
    case 'REMOVE':
      return {
        ...state,
        phrases:
          action.payload.category === 'phrase'
            ? state.phrases.filter((item) => item.id !== action.payload.id)
            : state.phrases,
        concepts:
          action.payload.category === 'concept'
            ? state.concepts.filter((item) => item.id !== action.payload.id)
            : state.concepts
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

function upsert<T extends LibraryItem>(items: T[], next: T): T[] {
  const existingIndex = items.findIndex((item) => item.id === next.id);
  if (existingIndex >= 0) {
    const clone = [...items];
    clone[existingIndex] = next;
    return clone;
  }
  return [...items, next];
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export const LibraryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<LibraryContextValue>(
    () => ({
      ...state,
      upsertItem: (item) => {
        if (item.type === 'phrase') {
          dispatch({ type: 'UPSERT_PHRASE', payload: item });
        } else {
          dispatch({ type: 'UPSERT_CONCEPT', payload: item });
        }
      },
      removeItem: (id, category) => dispatch({ type: 'REMOVE', payload: { id, category } }),
      reset: () => dispatch({ type: 'RESET' })
    }),
    [state]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
}
