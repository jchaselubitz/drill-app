import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';

import type { FilterTab } from './FilterTabs';

type LessonsEmptyStateProps = {
  activeTab: FilterTab;
};

export function LessonsEmptyState({ activeTab }: LessonsEmptyStateProps) {
  const colors = useColors();

  let title = '';
  let subtitle = '';

  switch (activeTab) {
    case 'topics':
      title = 'No learning topics yet';
      subtitle = 'Create your first topic to start learning with vocabulary and writing prompts';
      break;
    case 'lessons':
      title = 'No standalone prompts';
      subtitle = 'Writing prompts created with topics appear there instead';
      break;
    case 'sets':
      title = 'No standalone sets';
      subtitle = 'Vocabulary sets created with topics appear there instead';
      break;
  }

  return (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
});
