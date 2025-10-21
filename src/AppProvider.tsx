import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LessonProvider } from '@/state/LessonProvider';
import { LibraryProvider } from '@/state/LibraryProvider';

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LessonProvider>
          <LibraryProvider>{children}</LibraryProvider>
        </LessonProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
