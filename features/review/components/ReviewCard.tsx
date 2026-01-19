import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import type { Phrase } from '@/database/models';
import { useColors } from '@/hooks';

type ReviewCardProps = {
  front: Phrase;
  back: Phrase;
  showBack: boolean;
  onTogglePlayPause: (filename: string) => void;
  isPlayingFile: (filename: string) => boolean;
};

export function ReviewCard({
  front,
  back,
  showBack,
  onTogglePlayPause,
  isPlayingFile,
}: ReviewCardProps) {
  const colors = useColors();

  const renderPhraseRow = (phrase: Phrase) => {
    if (!phrase.filename) {
      return (
        <Text style={[styles.cardText, { color: colors.text }]} selectable>
          {phrase.text}
        </Text>
      );
    }

    const isPlaying = isPlayingFile(phrase.filename);

    return (
      <View style={styles.textRow}>
        <Text style={[styles.cardText, styles.textFlex, { color: colors.text }]} selectable>
          {phrase.text}
        </Text>
        <Pressable
          onPress={() => onTogglePlayPause(phrase.filename!)}
          style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={colors.primary} />
        </Pressable>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Prompt</Text>
      {renderPhraseRow(front)}
      {showBack && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Answer</Text>
          {renderPhraseRow(back)}
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textFlex: {
    flex: 1,
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
  playButton: {
    padding: 6,
  },
});
