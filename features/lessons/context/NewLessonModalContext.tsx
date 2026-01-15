import React, { createContext, useCallback, useContext, useState } from 'react';

type NewLessonModalContextType = {
  isVisible: boolean;
  open: () => void;
  close: () => void;
};

const NewLessonModalContext = createContext<NewLessonModalContextType | undefined>(undefined);

export function NewLessonModalProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const open = useCallback(() => setIsVisible(true), []);
  const close = useCallback(() => setIsVisible(false), []);

  return (
    <NewLessonModalContext.Provider value={{ isVisible, open, close }}>
      {children}
    </NewLessonModalContext.Provider>
  );
}

export function useNewLessonModal() {
  const context = useContext(NewLessonModalContext);
  if (context === undefined) {
    throw new Error('useNewLessonModal must be used within a NewLessonModalProvider');
  }
  return context;
}
