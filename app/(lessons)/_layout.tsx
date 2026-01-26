import { Stack } from 'expo-router';

import { useColors } from '@/hooks';

export default function LessonsLayout() {
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
      <Stack.Screen name="set/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="lesson/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="review/session" options={{ headerShown: false }} />
    </Stack>
  );
}
