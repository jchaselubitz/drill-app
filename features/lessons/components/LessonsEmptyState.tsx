import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';

export function LessonsEmptyState() {
  const colors = useColors();

  return (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No learning topics yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Create your first topic to start learning with vocabulary and writing prompts
      </Text>
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
