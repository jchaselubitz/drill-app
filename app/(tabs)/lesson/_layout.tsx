import { Stack } from 'expo-router';
import { colors } from '@/theme/colors';

export default function LessonLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'New Lesson' }} />
      <Stack.Screen name="session" options={{ title: 'Active Lesson' }} />
    </Stack>
  );
}
