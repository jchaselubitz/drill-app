import React, { createContext, useCallback, useContext, useState } from 'react';

type ModalMode = 'lesson' | 'set';

type NewLessonModalContextType = {
  isVisible: boolean;
  initialMode: ModalMode;
  open: (mode?: ModalMode) => void;
  close: () => void;
};

const NewLessonModalContext = createContext<NewLessonModalContextType | undefined>(undefined);

export function NewLessonModalProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);
  const [initialMode, setInitialMode] = useState<ModalMode>('lesson');

  const open = useCallback((mode: ModalMode = 'lesson') => {
    setInitialMode(mode);
    setIsVisible(true);
  }, []);
  const close = useCallback(() => setIsVisible(false), []);

  return (
    <NewLessonModalContext.Provider value={{ isVisible, initialMode, open, close }}>
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
