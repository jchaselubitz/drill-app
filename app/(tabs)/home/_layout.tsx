import { colors } from '@/theme/colors';
import { Stack } from 'expo-router';

export default function Home() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          headerStyle: { backgroundColor: colors.background },
        }}
      />
    </Stack>
  );
}
