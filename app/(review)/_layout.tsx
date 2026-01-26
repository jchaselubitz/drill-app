import { Stack } from 'expo-router';

import { useColors } from '@/hooks';

export default function ReviewLayout() {
  const colors = useColors();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { color: colors.text },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="session" options={{ headerShown: false }} />
      <Stack.Screen name="decks" options={{ title: 'Manage Decks' }} />
    </Stack>
  );
}
