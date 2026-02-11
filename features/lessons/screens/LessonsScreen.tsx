import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Deck, Lesson, Subject } from '@/database/models';
import {
  DECK_TABLE,
  DECK_TRANSLATION_TABLE,
  LESSON_TABLE,
  SRS_CARD_TABLE,
  SUBJECT_TABLE,
} from '@/database/schema';
import {
  FilterTab,
  FilterTabs,
  LessonCard,
  LessonsEmptyState,
  NewLessonModal,
} from '@/features/lessons/components';
import { GlassAddButton } from '@/features/lessons/components/GlassAddButton';
import { useNewLessonModal } from '@/features/lessons/context/NewLessonModalContext';
import { SetCard } from '@/features/sets/components';
import { SubjectCard } from '@/features/subject/components';
import { useColors } from '@/hooks';

type ListItem =
  | { type: 'subject'; data: Subject; phraseCount: number; dueCount: number; lessonCount: number }
  | { type: 'lesson'; data: Lesson; attemptCount: number }
  | { type: 'set'; data: Deck; phraseCount: number; dueCount: number };

export default function LessonsScreen() {
  const colors = useColors();
  const router = useRouter();
  const db = useDatabase();
  const { isVisible: isModalVisible, close: closeModal } = useNewLessonModal();

  const [activeTab, setActiveTab] = useState<FilterTab>('topics');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [sets, setSets] = useState<Deck[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});
  const [phraseCounts, setPhraseCounts] = useState<Record<string, number>>({});
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});
  const [subjectLessonCounts, setSubjectLessonCounts] = useState<Record<string, number>>({});

  // Subscribe to subjects
  useEffect(() => {
    const subscription = db.collections
      .get<Subject>(SUBJECT_TABLE)
      .query(Q.sortBy('created_at', Q.desc))
      .observe()
      .subscribe(async (results) => {
        setSubjects(results);

        // Get phrase counts, due counts, and lesson counts for each subject
        const phraseCountsMap: Record<string, number> = {};
        const dueCountsMap: Record<string, number> = {};
        const lessonCountsMap: Record<string, number> = {};
        const nowMs = Date.now();

        await Promise.all(
          results.map(async (subject) => {
            if (!subject.deckId) {
              phraseCountsMap[subject.id] = 0;
              dueCountsMap[subject.id] = 0;
            } else {
              // Count translations in deck
              const deckTranslations = await db.collections
                .get(DECK_TRANSLATION_TABLE)
                .query(Q.where('deck_id', subject.deckId))
                .fetchCount();
              phraseCountsMap[subject.id] = deckTranslations;

              // Count due cards
              const dueCards = await db.collections
                .get(SRS_CARD_TABLE)
                .query(Q.where('deck_id', subject.deckId), Q.where('due_at', Q.lte(nowMs)))
                .fetchCount();
              dueCountsMap[subject.id] = dueCards;
            }

            // Count lessons for this subject
            const lessonCount = await db.collections
              .get(LESSON_TABLE)
              .query(Q.where('subject_id', subject.id))
              .fetchCount();
            lessonCountsMap[subject.id] = lessonCount;
          })
        );

        setPhraseCounts((prev) => ({ ...prev, ...phraseCountsMap }));
        setDueCounts((prev) => ({ ...prev, ...dueCountsMap }));
        setSubjectLessonCounts(lessonCountsMap);
      });

    return () => subscription.unsubscribe();
  }, [db]);

  // Subscribe to standalone lessons (not linked to a subject)
  useEffect(() => {
    const subscription = db.collections
      .get<Lesson>(LESSON_TABLE)
      .query(Q.where('subject_id', null), Q.sortBy('created_at', Q.desc))
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

  // Subscribe to standalone AI-generated sets (not linked to a subject)
  useEffect(() => {
    const subscription = db.collections
      .get<Deck>(DECK_TABLE)
      .query(
        Q.where('source', 'ai_generated'),
        Q.where('archived', false),
        Q.where('subject_id', null),
        Q.sortBy('created_at', Q.desc)
      )
      .observe()
      .subscribe(async (results) => {
        setSets(results);

        // Get phrase counts and due counts for each set
        const phraseCountsMap: Record<string, number> = {};
        const dueCountsMap: Record<string, number> = {};
        const nowMs = Date.now();

        await Promise.all(
          results.map(async (deck) => {
            // Count translations in deck
            const deckTranslations = await db.collections
              .get(DECK_TRANSLATION_TABLE)
              .query(Q.where('deck_id', deck.id))
              .fetchCount();
            phraseCountsMap[deck.id] = deckTranslations;

            // Count due cards
            const dueCards = await db.collections
              .get(SRS_CARD_TABLE)
              .query(Q.where('deck_id', deck.id), Q.where('due_at', Q.lte(nowMs)))
              .fetchCount();
            dueCountsMap[deck.id] = dueCards;
          })
        );

        setPhraseCounts((prev) => ({ ...prev, ...phraseCountsMap }));
        setDueCounts((prev) => ({ ...prev, ...dueCountsMap }));
      });

    return () => subscription.unsubscribe();
  }, [db]);

  const handleSubjectPress = (subjectId: string) => {
    router.push(`/subject/${subjectId}` as any);
  };

  const handleLessonPress = (lessonId: string) => {
    router.push(`/lesson/${lessonId}` as any);
  };

  const handleSetPress = (deckId: string) => {
    router.push(`/set/${deckId}` as any);
  };

  // Combine and filter list items based on active tab
  const getListItems = useCallback((): ListItem[] => {
    if (activeTab === 'topics') {
      return subjects.map((subject) => ({
        type: 'subject' as const,
        data: subject,
        phraseCount: phraseCounts[subject.id] ?? 0,
        dueCount: dueCounts[subject.id] ?? 0,
        lessonCount: subjectLessonCounts[subject.id] ?? 0,
      }));
    }

    if (activeTab === 'lessons') {
      return lessons.map((lesson) => ({
        type: 'lesson' as const,
        data: lesson,
        attemptCount: attemptCounts[lesson.id] ?? 0,
      }));
    }

    return sets.map((deck) => ({
      type: 'set' as const,
      data: deck,
      phraseCount: phraseCounts[deck.id] ?? 0,
      dueCount: dueCounts[deck.id] ?? 0,
    }));
  }, [subjects, lessons, sets, attemptCounts, phraseCounts, dueCounts, subjectLessonCounts, activeTab]);

  const listItems = getListItems();

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'subject') {
      return (
        <SubjectCard
          subject={item.data}
          phraseCount={item.phraseCount}
          dueCount={item.dueCount}
          lessonCount={item.lessonCount}
          onPress={handleSubjectPress}
        />
      );
    }
    if (item.type === 'lesson') {
      return (
        <LessonCard
          lesson={item.data}
          attemptCount={item.attemptCount}
          onPress={handleLessonPress}
        />
      );
    }
    return (
      <SetCard
        deck={item.data}
        phraseCount={item.phraseCount}
        dueCount={item.dueCount}
        onPress={handleSetPress}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.filterContainer}>
        <FilterTabs activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.data.id}`}
        contentContainerStyle={[
          styles.listContent,
          listItems.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={() => <LessonsEmptyState activeTab={activeTab} />}
        ListFooterComponent={() => (
          <View style={styles.addButton}>
            <GlassAddButton activeTab={activeTab} />
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
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
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
