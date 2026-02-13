import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components';
import type Deck from '@/database/models/Deck';
import { useColors } from '@/hooks';

type OrphanDeckCardProps = {
  deck: Deck;
  phraseCount: number;
  onConvert: (deck: Deck) => void;
};

export function OrphanDeckCard({ deck, phraseCount, onConvert }: OrphanDeckCardProps) {
  const colors = useColors();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="albums-outline" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {deck.name}
        </Text>
        {deck.level && (
          <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.levelText, { color: colors.primary }]}>{deck.level}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {phraseCount} phrase{phraseCount !== 1 ? 's' : ''} — not linked to a topic
      </Text>

      <Pressable
        style={[styles.convertButton, { backgroundColor: colors.primary }]}
        onPress={() => onConvert(deck)}
      >
        <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
        <Text style={styles.convertText}>Convert to Topic</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
  },
  convertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  convertText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
