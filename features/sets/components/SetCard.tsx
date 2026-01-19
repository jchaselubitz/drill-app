import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components';
import { Deck } from '@/database/models';
import { useColors } from '@/hooks';

type SetCardProps = {
  deck: Deck;
  phraseCount: number;
  dueCount: number;
  onPress: (deckId: string) => void;
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export function SetCard({ deck, phraseCount, dueCount, onPress }: SetCardProps) {
  const colors = useColors();

  return (
    <Pressable onPress={() => onPress(deck.id)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="library" size={18} color={colors.primary} />
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {deck.name}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {phraseCount} phrases
            </Text>
          </View>
          {dueCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>{dueCount} due</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatDate(deck.createdAt)}
            </Text>
          </View>
          {deck.level && (
            <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
              <Text style={[styles.levelText, { color: colors.primary }]}>{deck.level}</Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
