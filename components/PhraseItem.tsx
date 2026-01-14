import { Ionicons } from '@expo/vector-icons';
import { withObservables } from '@nozbe/watermelondb/react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Phrase } from '@/database';
import { colors, spacing, typography } from '@/theme/colors';

const PhraseItemInner = ({ phrase }: { phrase: Phrase }) => {
  const toggleFavorite = async () => {
    try {
      await phrase.updateFavorite(!phrase.favorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };
  const handlePlayAudio = () => {
    console.log('handlePlayAudio');
  };
  return (
    <View style={styles.entry}>
      <Text style={styles.entryValue}>{phrase.text}</Text>
      <View style={styles.entryActions}>
        <View style={styles.entryTranslationContainer}>
          <Text style={styles.entryTranslation}>{phrase.lang}</Text>
        </View>
        <TouchableOpacity onPress={toggleFavorite} style={styles.entryAction}>
          <Ionicons
            name="heart"
            size={24}
            color={phrase.favorite ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayAudio} style={styles.entryAction}>
          <Ionicons name="play" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PhraseItem = withObservables(['phrase'], ({ phrase }: { phrase: Phrase }) => ({
  phrase: phrase.observe(),
}))(PhraseItemInner);

export default PhraseItem;

const styles = StyleSheet.create({
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  entryValue: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  entryTranslationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  entryTranslation: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  entryActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  entryAction: {
    padding: spacing.sm,
  },
  entryActionIcon: {
    color: colors.textPrimary,
  },
});
