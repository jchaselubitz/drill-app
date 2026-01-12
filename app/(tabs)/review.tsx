import { Card } from '@/components';
import { Lesson } from '@/database/models';
import { LESSON_TABLE } from '@/database/schema';
import { useColors } from '@/hooks';
import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LibraryScreen() {
  const colors = useColors();
  const router = useRouter();
  const db = useDatabase();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const subscription = db.collections
      .get<Lesson>(LESSON_TABLE)
      .query(Q.sortBy('created_at', Q.desc))
      .observe()
      .subscribe((results) => {
        setLessons(results);
        // Fetch attempt counts for each lesson
        Promise.all(
          results.map(async (lesson) => {
            const count = await lesson.attempts.fetchCount();
            return { id: lesson.id, count };
          })
        ).then((counts) => {
          const countsMap: Record<string, number> = {};
          counts.forEach(({ id, count }) => {
            countsMap[id] = count;
          });
          setAttemptCounts(countsMap);
        });
      });

    return () => subscription.unsubscribe();
  }, [db]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleLessonPress = (lessonId: string) => {
    router.push(`/lesson/${lessonId}` as any);
  };

  const renderLesson = ({ item }: { item: Lesson }) => (
    <Pressable onPress={() => handleLessonPress(item.id)}>
      <Card style={styles.lessonCard}>
        <View style={styles.lessonHeader}>
          <Text style={[styles.lessonTopic, { color: colors.text }]} numberOfLines={1}>
            {item.topic}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </View>
        <Text style={[styles.lessonPrompt, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.prompt}
        </Text>
        <View style={styles.lessonMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="document-text-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.metaText, { color: colors.textSecondary }]}>
              {attemptCounts[item.id] ?? 0} attempts
            </Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.levelText, { color: colors.primary }]}>{item.level}</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={64} color={colors.textSecondary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No lessons yet</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        Generate a lesson in the Practice tab to get started
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <FlatList
        data={lessons}
        renderItem={renderLesson}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          lessons.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
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
  emptyState: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
});
