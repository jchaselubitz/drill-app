import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';

import type { FilterTab } from './FilterTabs';

type LessonsEmptyStateProps = {
  activeTab: FilterTab;
};

export function LessonsEmptyState({ activeTab }: LessonsEmptyStateProps) {
  const colors = useColors();

  const isWriteTab = activeTab === 'lessons';
  const title = isWriteTab ? 'No writing prompts yet' : 'No study sets yet';
  const subtitle = isWriteTab ? 'Create your first writing prompt' : 'Create your first study set';

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
