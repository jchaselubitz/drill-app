import 'react-native-gesture-handler';

import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LessonProvider } from '@/context/LessonContext';
import RootNavigator from '@/navigation/RootNavigator';
import { colors } from '@/theme/colors';

const queryClient = new QueryClient();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    text: colors.textPrimary,
    primary: colors.primary,
    border: colors.border,
  },
};

export default function Index() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LessonProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar style="light" />
            <RootNavigator />
          </NavigationContainer>
        </LessonProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

// import { Text, View } from 'react-native';

// export default function Index() {
//   return (
//     <View
//       style={{
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}
//     >
//       <Text>Edit app/index.tsx to edit this screen. Does this change show?</Text>
//     </View>
//   );
// }
