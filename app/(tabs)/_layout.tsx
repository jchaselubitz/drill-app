import { Ionicons } from '@expo/vector-icons';
import { Icon, NativeTabs, Label } from 'expo-router/unstable-native-tabs';
import { useColors } from '@/hooks';

export default function TabLayout() {
  const colors = useColors();

  return (
    <NativeTabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <NativeTabs.Screen
        name="index"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color, size }) => (
            <Icon>
              <Ionicons name="create-outline" size={size} color={color} />
            </Icon>
          ),
          tabBarLabel: ({ color }) => <Label style={{ color }}>Practice</Label>,
        }}
      />
      <NativeTabs.Screen
        name="review"
        options={{
          title: 'Review',
          tabBarIcon: ({ color, size }) => (
            <Icon>
              <Ionicons name="checkmark-circle-outline" size={size} color={color} />
            </Icon>
          ),
          tabBarLabel: ({ color }) => <Label style={{ color }}>Review</Label>,
        }}
      />
      <NativeTabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon>
              <Ionicons name="settings-outline" size={size} color={color} />
            </Icon>
          ),
          tabBarLabel: ({ color }) => <Label style={{ color }}>Settings</Label>,
        }}
      />
    </NativeTabs>
  );
}
