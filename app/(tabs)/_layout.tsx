import { useColors } from '@/hooks';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  const colors = useColors();

  return (
    <NativeTabs
      iconColor={{
        default: colors.textSecondary,
        selected: colors.primary,
      }}
      labelStyle={{
        default: { color: colors.textSecondary },
        selected: { color: colors.primary },
      }}
    >
      <NativeTabs.Trigger
        name="index"
        options={{
          title: 'Practice',
        }}
      >
        <Icon sf="house.fill" drawable="custom_android_drawable" />
        <Label>Lesson</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger
        name="review"
        options={{
          title: 'Review',
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
