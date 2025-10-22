import 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonProvider } from '@/context/LessonContext';

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LessonProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#1a1a1a' },
              headerTintColor: '#ffffff',
              contentStyle: { backgroundColor: '#000000' },
            }}
          />
        </LessonProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
