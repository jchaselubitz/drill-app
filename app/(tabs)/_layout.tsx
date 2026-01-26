import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StyleSheet } from 'react-native';

import { NewLessonModalProvider } from '@/features/lessons/context/NewLessonModalContext';
import { useColors } from '@/hooks';

function TabLayoutContent() {
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
          title: 'Lessons',
        }}
      >
        <NativeTabs.Trigger.Icon sf="house.fill" drawable="custom_android_drawable" />
        <NativeTabs.Trigger.Label>Lessons</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="library"
        options={{
          title: 'Library',
        }}
      >
        <NativeTabs.Trigger.Icon sf="book.fill" drawable="custom_android_drawable" />
        <NativeTabs.Trigger.Label>Library</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="review"
        options={{
          title: 'Review',
        }}
      >
        <NativeTabs.Trigger.Icon sf="rectangle.stack.fill" drawable="custom_android_drawable" />
        <NativeTabs.Trigger.Label>Review</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger
        name="settings"
        options={{
          title: 'Settings',
        }}
      >
        <NativeTabs.Trigger.Icon sf="gearshape.fill" drawable="custom_android_drawable" />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

export default function TabLayout() {
  return (
    <NewLessonModalProvider>
      <TabLayoutContent />
    </NewLessonModalProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  navContainer: {
    alignSelf: 'flex-start',
  },
});
