import 'react-native-gesture-handler';

import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsProvider } from '@/contexts/SettingsContext';
import database from '@/database';
import { NewLessonModalProvider } from '@/features/lessons/context/NewLessonModalContext';
import { useColors, useColorScheme, usePendingAudioRequests, usePendingRequests } from '@/hooks';

function BackgroundRequestHandler({ children }: { children: React.ReactNode }) {
  usePendingRequests();
  usePendingAudioRequests();
  return <>{children}</>;
}

function AppContent() {
  const colorScheme = useColorScheme();
  const colors = useColors();

  return (
    <NewLessonModalProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <NativeTabs
        iconColor={{
          default: colors.textSecondary,
          selected: colors.primary,
        }}
        labelStyle={{
          default: { color: colors.textSecondary },
          selected: { color: colors.primary },
        }}
      >
        <NativeTabs.Trigger name="(lessons)">
          <NativeTabs.Trigger.Icon sf="house.fill" drawable="custom_android_drawable" />
          <NativeTabs.Trigger.Label>Lessons</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="library">
          <NativeTabs.Trigger.Icon sf="book.fill" drawable="custom_android_drawable" />
          <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="(review)">
          <NativeTabs.Trigger.Icon sf="rectangle.stack.fill" drawable="custom_android_drawable" />
          <NativeTabs.Trigger.Label>Review</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="settings">
          <NativeTabs.Trigger.Icon sf="gearshape.fill" drawable="custom_android_drawable" />
          <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </NewLessonModalProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider database={database}>
        <SettingsProvider>
          <BackgroundRequestHandler>
            <AppContent />
          </BackgroundRequestHandler>
        </SettingsProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
