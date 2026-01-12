import { useColors, useColorScheme } from '@/hooks';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  console.log('GEMINI_KEY', process.env.EXPO_PUBLIC_GEMINI_API_KEY);
  const colors = useColors();

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack
          screenOptions={{
            headerShown: true,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
          }}
        />
        {/* <Stack.Screen name="+not-found" /> */}
      </Stack>
    </>
  );
}
