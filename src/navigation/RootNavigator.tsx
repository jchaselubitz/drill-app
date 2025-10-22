import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LessonRequestScreen from '@screens/LessonRequestScreen';
import LessonSessionScreen from '@screens/LessonSessionScreen';
import LibraryScreen from '@screens/LibraryScreen';
import SettingsScreen from '@screens/SettingsScreen';
import { colors } from '@theme/colors';
import { Ionicons } from '@expo/vector-icons';

export type RootStackParamList = {
  LessonRequest: undefined;
  LessonSession: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function LessonStack(): JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background }
      }}
    >
      <Stack.Screen
        name="LessonRequest"
        component={LessonRequestScreen}
        options={{ title: 'New Lesson' }}
      />
      <Stack.Screen
        name="LessonSession"
        component={LessonSessionScreen}
        options={{ title: 'Active Lesson' }}
      />
    </Stack.Navigator>
  );
}

const tabBarIcon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: any) => (
  <Ionicons name={name} size={size} color={color} />
);

export default function RootNavigator(): JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary
      }}
    >
      <Tab.Screen
        name="Lesson"
        component={LessonStack}
        options={{
          tabBarLabel: 'Lesson',
          tabBarIcon: tabBarIcon('school-outline')
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
          tabBarIcon: tabBarIcon('library-outline')
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: tabBarIcon('settings-outline')
        }}
      />
    </Tab.Navigator>
  );
}
