import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components';
import { Lesson } from '@/database/models';
import { useColors } from '@/hooks';

type PromptCardProps = {
  lesson: Lesson;
};

export function PromptCard({ lesson }: PromptCardProps) {
  const colors = useColors();

  return (
    <Card style={styles.promptCard}>
      <View style={styles.promptHeader}>
        <Ionicons name="bulb" size={20} color={colors.primary} />
        <Text style={[styles.promptLabel, { color: colors.textSecondary }]}>Writing Prompt</Text>
      </View>
      <Text style={[styles.promptText, { color: colors.text }]} selectable>
        {lesson.prompt}
      </Text>
      <View style={styles.lessonMeta}>
        <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
          <Text style={[styles.levelText, { color: colors.primary }]}>{lesson.level}</Text>
        </View>
        {lesson.phrases && (
          <Text style={[styles.phrasesText, { color: colors.textSecondary }]}>
            Phrases: {lesson.phrases}
          </Text>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    gap: 12,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  promptText: {
    fontSize: 17,
    lineHeight: 26,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
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
  phrasesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
