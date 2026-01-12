import { AuthProvider } from '@/context/AuthContext';
import database from '@/database';
import { DatabaseProvider } from '@nozbe/watermelondb/DatabaseProvider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Suppress WatermelonDB NONE property warnings (known non-fatal issue with Hermes)
// LogBox.ignoreLogs([
//   "Cannot assign to read-only property 'NONE'",
//   "Cannot assign to read only property 'NONE'",
// ]);

// // Also suppress console errors for this specific warning
// if (__DEV__) {
//   const originalError = console.error;
//   console.error = (...args) => {
//     if (
//       typeof args[0] === 'string' &&
//       args[0].includes("Cannot assign to read-only property 'NONE'")
//     ) {
//       return;
//     }
//     originalError(...args);
//   };
// }

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider database={database}>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: '#1a1a1a' },
              headerTintColor: '#ffffff',
              contentStyle: { backgroundColor: '#000000' },
              headerShown: false,
            }}
          />
        </AuthProvider>
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
