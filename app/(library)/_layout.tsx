import { Stack } from 'expo-router';

import { useColors } from '@/hooks';

export default function LibraryLayout() {
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
      <Stack.Screen name="phrase/[id]" options={{ headerShown: true }} />
    </Stack>
  );
}
