import { useAuth } from '@/context/AuthContext';
import { Icon, NativeTabs, Label } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const { session, loading } = useAuth();

  return (
    <NativeTabs>
      <NativeTabs.Trigger
        name="home"
        options={{
          title: 'Home',
        }}
      >
        <Icon sf="house.fill" drawable="custom_android_drawable" />
        <Label>Home</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="library"
        options={{
          title: 'Library',
        }}
      >
        <Icon sf="books.vertical.fill" drawable="custom_android_drawable" />
        <Label>Library</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="settings"
        options={{
          title: 'Settings',
        }}
      >
        <Icon sf="gearshape.fill" drawable="custom_android_drawable" />
        <Label>Settings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

// nativeTabOptions={{

//   tabBarStyle: { backgroundColor: colors.surface },
//   tabBarActiveTintColor: colors.primary,
//   tabBarInactiveTintColor: colors.textSecondary,
// }}
// >
