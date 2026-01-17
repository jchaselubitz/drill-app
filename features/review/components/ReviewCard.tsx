import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import type { Phrase } from '@/database/models';
import { useColors } from '@/hooks';

type ReviewCardProps = {
  front: Phrase;
  back: Phrase;
  showBack: boolean;
};

export function ReviewCard({ front, back, showBack }: ReviewCardProps) {
  const colors = useColors();

  return (
    <Card style={styles.card}>
      <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Prompt</Text>
      <Text style={[styles.cardText, { color: colors.text }]} selectable>
        {front.text}
      </Text>
      {showBack && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Answer</Text>
          <Text style={[styles.cardText, { color: colors.text }]} selectable>
            {back.text}
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  cardLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  cardText: {
    fontSize: 20,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#00000010',
  },
});
