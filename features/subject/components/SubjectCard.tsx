import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components';
import type Subject from '@/database/models/Subject';
import { useColors } from '@/hooks';

type SubjectCardProps = {
  subject: Subject;
  phraseCount: number;
  dueCount: number;
  lessonCount: number;
  onPress: (id: string) => void;
};

export function SubjectCard({
  subject,
  phraseCount,
  dueCount,
  lessonCount,
  onPress,
}: SubjectCardProps) {
  const colors = useColors();

  return (
    <Pressable onPress={() => onPress(subject.id)}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {subject.name}
          </Text>
          <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.levelText, { color: colors.primary }]}>{subject.level}</Text>
          </View>
        </View>

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="book-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {phraseCount} phrases
            </Text>
          </View>

          {dueCount > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.primary }]}>{dueCount} due</Text>
            </View>
          )}

          <View style={styles.statItem}>
            <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {lessonCount} prompt{lessonCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={[styles.featureBadge, { backgroundColor: colors.card }]}>
            <Ionicons name="flash-outline" size={12} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>SRS</Text>
          </View>
          <View style={[styles.featureBadge, { backgroundColor: colors.card }]}>
            <Ionicons name="pencil-outline" size={12} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>Writing</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
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
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
