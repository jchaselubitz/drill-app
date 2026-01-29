import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FavoriteButton, GlassCompatibleView } from '@/components';
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
    <Pressable onPress={() => onPress?.(phrase.id)}>
      <GlassCompatibleView
        style={styles.container}
        glassEffectStyle="regular"
        isInteractive
        fallbackStyle={{ borderColor: colors.border, borderWidth: 1 }}
      >
        <View style={styles.content}>
          <Text style={[styles.text, { color: colors.text }]}>{phrase.text}</Text>
          <Text style={[styles.language, { color: colors.textSecondary }]}>{languageDisplay}</Text>
        </View>
        <FavoriteButton phrase={phrase} size={22} hitSlop={8} />
      </GlassCompatibleView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  content: {
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
