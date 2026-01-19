import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components';
import { useColors } from '@/hooks';
import type { GeneratedPhrase } from '@/types';

type SetPreviewCardProps = {
  phrases: GeneratedPhrase[];
  onRemovePhrase: (index: number) => void;
  onSave: () => void;
  isSaving?: boolean;
};

export function SetPreviewCard({
  phrases,
  onRemovePhrase,
  onSave,
  isSaving = false,
}: SetPreviewCardProps) {
  const colors = useColors();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="list" size={20} color={colors.primary} />
        <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>
          Generated Phrases ({phrases.length})
        </Text>
      </View>

      <ScrollView style={styles.phraseList} showsVerticalScrollIndicator={false}>
        {phrases.map((phrase, index) => (
          <View key={index} style={[styles.phraseItem, { borderBottomColor: colors.border }]}>
            <View style={styles.phraseContent}>
              <Text style={[styles.primaryText, { color: colors.text }]}>{phrase.primary}</Text>
              <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>
                {phrase.secondary}
              </Text>
              {phrase.partOfSpeech && (
                <Text style={[styles.partOfSpeech, { color: colors.primary }]}>
                  {phrase.partOfSpeech}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => onRemovePhrase(index)}
              hitSlop={8}
              style={styles.removeButton}
            >
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <Button
        text="Save Phrase Set"
        onPress={onSave}
        buttonState={isSaving ? 'loading' : phrases.length === 0 ? 'disabled' : 'default'}
        loadingText="Saving..."
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  phraseList: {
    maxHeight: 300,
  },
  phraseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  phraseContent: {
    flex: 1,
    gap: 2,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryText: {
    fontSize: 14,
  },
  partOfSpeech: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },
});
