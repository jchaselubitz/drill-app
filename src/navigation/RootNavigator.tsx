import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LessonRequestScreen from '@/screens/LessonRequestScreen';
import ActiveLessonScreen from '@/screens/ActiveLessonScreen';
import LibraryScreen from '@/screens/LibraryScreen';
import SettingsScreen from '@/screens/SettingsScreen';
import { Ionicons } from '@expo/vector-icons';

export type RootStackParamList = {
  RootTabs: undefined;
  Lesson: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const lightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F9FAFB',
    card: '#111827',
    text: '#111827',
    primary: '#6366F1'
  }
};

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF'
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Lessons') {
            iconName = 'create-outline';
          } else if (route.name === 'Library') {
            iconName = 'book-outline';
          } else if (route.name === 'Settings') {
            iconName = 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Lessons" component={LessonRequestScreen} />
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer theme={lightTheme}>
      <Stack.Navigator>
        <Stack.Screen name="RootTabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Lesson"
          component={ActiveLessonScreen}
          options={{ title: 'Active Lesson', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
