import database from '@/database';
import { useColorScheme } from '@/hooks';
import { DatabaseProvider } from '@nozbe/watermelondb/react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <DatabaseProvider database={database}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }} />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
