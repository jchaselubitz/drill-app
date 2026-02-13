import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import database from '@/database';
import { Deck, Subject } from '@/database/models';
import {
  DECK_TABLE,
  DECK_TRANSLATION_TABLE,
  LESSON_TABLE,
  SRS_CARD_TABLE,
  SUBJECT_TABLE,
} from '@/database/schema';
import { LessonsEmptyState, NewLessonModal } from '@/features/lessons/components';
import { GlassAddButton } from '@/features/lessons/components/GlassAddButton';
import { useNewLessonModal } from '@/features/lessons/context/NewLessonModalContext';
import { SubjectCard } from '@/features/subject/components';
import { useColors } from '@/hooks';
import { convertDeckToSubject } from '@/lib/services/subjectService';

import { OrphanDeckCard } from '../components/OrphanDeckCard';

type ListItem =
  | { type: 'subject'; data: Subject; phraseCount: number; dueCount: number; lessonCount: number }
  | { type: 'orphan_deck'; data: Deck; phraseCount: number };

export default function LessonsScreen() {
  const colors = useColors();
  const router = useRouter();
  const db = useDatabase();
  const { isVisible: isModalVisible, close: closeModal } = useNewLessonModal();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [orphanDecks, setOrphanDecks] = useState<Deck[]>([]);
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
              const deckTranslations = await db.collections
                .get(DECK_TRANSLATION_TABLE)
                .query(Q.where('deck_id', subject.deckId))
                .fetchCount();
              phraseCountsMap[subject.id] = deckTranslations;

              const dueCards = await db.collections
                .get(SRS_CARD_TABLE)
                .query(Q.where('deck_id', subject.deckId), Q.where('due_at', Q.lte(nowMs)))
                .fetchCount();
              dueCountsMap[subject.id] = dueCards;
            }

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

  // Subscribe to orphan decks (AI-generated, no subject, not archived)
  useEffect(() => {
    const subscription = db.collections
      .get<Deck>(DECK_TABLE)
      .query(
        Q.where('source', 'ai_generated'),
        Q.where('subject_id', null),
        Q.where('archived', false),
        Q.sortBy('created_at', Q.desc)
      )
      .observe()
      .subscribe(async (results) => {
        setOrphanDecks(results);

        const phraseCountsMap: Record<string, number> = {};
        await Promise.all(
          results.map(async (deck) => {
            const count = await db.collections
              .get(DECK_TRANSLATION_TABLE)
              .query(Q.where('deck_id', deck.id))
              .fetchCount();
            phraseCountsMap[deck.id] = count;
          })
        );

        setPhraseCounts((prev) => ({ ...prev, ...phraseCountsMap }));
      });

    return () => subscription.unsubscribe();
  }, [db]);

  const handleSubjectPress = (subjectId: string) => {
    router.push(`/subject/${subjectId}` as any);
  };

  const handleConvertDeck = async (deck: Deck) => {
    try {
      const subject = await convertDeckToSubject(database, deck);
      router.push(`/subject/${subject.id}` as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to convert deck to topic. Please try again.');
      console.error(error);
    }
  };

  const getListItems = useCallback((): ListItem[] => {
    const items: ListItem[] = [];

    // Orphan decks first
    for (const deck of orphanDecks) {
      items.push({
        type: 'orphan_deck',
        data: deck,
        phraseCount: phraseCounts[deck.id] ?? 0,
      });
    }

    // Then subjects
    for (const subject of subjects) {
      items.push({
        type: 'subject',
        data: subject,
        phraseCount: phraseCounts[subject.id] ?? 0,
        dueCount: dueCounts[subject.id] ?? 0,
        lessonCount: subjectLessonCounts[subject.id] ?? 0,
      });
    }

    return items;
  }, [subjects, orphanDecks, phraseCounts, dueCounts, subjectLessonCounts]);

  const listItems = getListItems();

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === 'orphan_deck') {
      return (
        <OrphanDeckCard
          deck={item.data}
          phraseCount={item.phraseCount}
          onConvert={handleConvertDeck}
        />
      );
    }
    return (
      <SubjectCard
        subject={item.data}
        phraseCount={item.phraseCount}
        dueCount={item.dueCount}
        lessonCount={item.lessonCount}
        onPress={handleSubjectPress}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <FlatList
        data={listItems}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.data.id}`}
        contentContainerStyle={[
          styles.listContent,
          listItems.length === 0 && styles.emptyListContent,
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
