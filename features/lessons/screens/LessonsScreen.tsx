import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Lesson } from '@/database/models';
import { LESSON_TABLE } from '@/database/schema';
import { LessonCard, LessonsEmptyState, NewLessonModal } from '@/features/lessons/components';
import { GlassAddButton } from '@/features/lessons/components/GlassAddButton';
import { useNewLessonModal } from '@/features/lessons/context/NewLessonModalContext';
import { useColors } from '@/hooks';

export default function LessonsScreen() {
  const colors = useColors();
  const router = useRouter();
  const db = useDatabase();
  const { isVisible: isModalVisible, close: closeModal, open: openModal } = useNewLessonModal();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const subscription = db.collections
      .get<Lesson>(LESSON_TABLE)
      .query(Q.sortBy('created_at', Q.desc))
      .observe()
      .subscribe((results) => {
        setLessons(results);
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

  const handleLessonPress = (lessonId: string) => {
    router.push(`/lesson/${lessonId}` as any);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <FlatList
        data={lessons}
        renderItem={({ item }) => (
          <LessonCard
            lesson={item}
            attemptCount={attemptCounts[item.id] ?? 0}
            onPress={handleLessonPress}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          lessons.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={() => <LessonsEmptyState />}
        ListFooterComponent={() => (
          <View style={styles.addButton}>
            <GlassAddButton />
          </View>
        )}
      />
      <NewLessonModal visible={isModalVisible} onClose={closeModal} />
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
  addButton: {
    paddingTop: 16,
    alignItems: 'center',
  },
});
