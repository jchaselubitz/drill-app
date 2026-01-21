import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FavoriteButton } from '@/components/FavoriteButton';
import { Languages } from '@/constants';
import { Phrase } from '@/database/models';
import { useColors } from '@/hooks';

type PhraseCardProps = {
  phrase: Phrase;
  onPress?: (phraseId: string) => void;
};

export function PhraseCard({ phrase, onPress }: PhraseCardProps) {
  const colors = useColors();

  const language = Languages.find((l) => l.code === phrase.lang);
  const languageDisplay = language ? `${language.icon} ${language.name}` : phrase.lang;

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => onPress?.(phrase.id)}
    >
      <View style={styles.content}>
        <Text style={[styles.text, { color: colors.text }]}>{phrase.text}</Text>
        <Text style={[styles.language, { color: colors.textSecondary }]}>{languageDisplay}</Text>
      </View>
      <FavoriteButton phrase={phrase} size={22} hitSlop={8} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  language: {
    fontSize: 13,
  },
});
