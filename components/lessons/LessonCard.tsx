import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components';
import { Lesson } from '@/database/models';
import { useColors } from '@/hooks';

type LessonCardProps = {
  lesson: Lesson;
  attemptCount: number;
  onPress: (lessonId: string) => void;
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export function LessonCard({ lesson, attemptCount, onPress }: LessonCardProps) {
  const colors = useColors();

  return (
    <Pressable onPress={() => onPress(lesson.id)}>
      <Card style={styles.lessonCard}>
        <View style={styles.lessonHeader}>
          <Text style={[styles.lessonTopic, { color: colors.text }]} numberOfLines={1}>
            {lesson.topic}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
        <Text style={[styles.lessonPrompt, { color: colors.textSecondary }]} numberOfLines={2}>
          {lesson.prompt}
        </Text>
        <View style={styles.lessonMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatDate(lesson.createdAt)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {attemptCount} attempts
            </Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.levelText, { color: colors.primary }]}>{lesson.level}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  lessonCard: {
    gap: 8,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lessonTopic: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  lessonPrompt: {
    fontSize: 14,
    lineHeight: 20,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
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
