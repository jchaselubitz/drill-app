import 'react-native-gesture-handler';

import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SettingsProvider } from '@/contexts/SettingsContext';
import database from '@/database';
import { useColorScheme, usePendingRequests } from '@/hooks';

// Suppress WatermelonDB NONE property warnings (known non-fatal issue with Hermes)
LogBox.ignoreLogs([
  "Cannot assign to read-only property 'NONE'",
  "Cannot assign to read only property 'NONE'",
]);

// Also suppress console errors for this specific warning
if (__DEV__) {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes("Cannot assign to read-only property 'NONE'")
    ) {
      return;
    }
    originalError(...args);
  };
}

function BackgroundRequestHandler({ children }: { children: React.ReactNode }) {
  usePendingRequests();
  return <>{children}</>;
}

function AppContent() {
  const colorScheme = useColorScheme();

  return (
    <DatabaseProvider database={database}>
      <BackgroundRequestHandler>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </BackgroundRequestHandler>
    </DatabaseProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </SafeAreaProvider>
  );
}
