import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function Settings() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerTitle: 'Settings',
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#ffffff',
          // contentStyle: { backgroundColor: '#000000' },
          headerLeft: () => (
            <Ionicons
              name="chevron-back"
              size={24}
              color="white"
              style={styles.headerButton}
              onPress={() => router.push('/home')}
            />
          ),
          headerRight: () => (
            <Ionicons name="search" size={24} color="white" style={styles.headerButton} />
          ),
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  headerButton: {
    paddingLeft: 4,
    paddingRight: 4,
  },
});
