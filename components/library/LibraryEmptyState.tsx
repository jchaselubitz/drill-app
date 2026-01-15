import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components';
import { useColors } from '@/hooks';

type LibraryEmptyStateProps = {
  onPressAdd: () => void;
};

export function LibraryEmptyState({ onPressAdd }: LibraryEmptyStateProps) {
  const colors = useColors();

  return (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No phrases yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Add words and phrases you want to learn
      </Text>
      <Button title="Add Phrase" onPress={onPressAdd} />
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
