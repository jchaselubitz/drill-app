import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import Constants from 'expo-constants';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components';
import database from '@/database';
import { Deck, Lesson, Subject } from '@/database/models';
import {
  ATTEMPT_TABLE,
  DECK_TABLE,
  DECK_TRANSLATION_TABLE,
  LESSON_TABLE,
  SUBJECT_TABLE,
} from '@/database/schema';
import { useColors, useDeckDueCount } from '@/hooks';
import { generateNewPromptForSubject } from '@/lib/services/subjectService';
import type { CEFRLevel } from '@/types';

import { LessonTypeCard } from '../components/LessonTypeCard';

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

function DeleteButton({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.5 : 1 }]}
    >
      <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const db = useDatabase();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [phraseCount, setPhraseCount] = useState(0);
  const [lessonCount, setLessonCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  const { dueCount } = useDeckDueCount(deck?.id ?? undefined);

  // Subscribe to subject
  useEffect(() => {
    if (!id) return;

    const sub = db.collections
      .get<Subject>(SUBJECT_TABLE)
      .findAndObserve(id)
      .subscribe((result) => setSubject(result));

    return () => sub.unsubscribe();
  }, [id, db]);

  // Subscribe to deck + phrase count
  useEffect(() => {
    if (!subject?.deckId) return;

    const deckSub = db.collections
      .get<Deck>(DECK_TABLE)
      .findAndObserve(subject.deckId)
      .subscribe((result) => setDeck(result));

    const phraseSub = db.collections
      .get(DECK_TRANSLATION_TABLE)
      .query(Q.where('deck_id', subject.deckId))
      .observeCount()
      .subscribe((count) => setPhraseCount(count));

    return () => {
      deckSub.unsubscribe();
      phraseSub.unsubscribe();
    };
  }, [subject?.deckId, db]);

  // Subscribe to lesson count + attempt count
  useEffect(() => {
    if (!id) return;

    const lessonSub = db.collections
      .get<Lesson>(LESSON_TABLE)
      .query(Q.where('subject_id', id))
      .observeCount()
      .subscribe((count) => setLessonCount(count));

    const attemptSub = db.collections
      .get(ATTEMPT_TABLE)
      .query(Q.on(LESSON_TABLE, Q.where('subject_id', id)))
      .observeCount()
      .subscribe((count) => setAttemptCount(count));

    return () => {
      lessonSub.unsubscribe();
      attemptSub.unsubscribe();
    };
  }, [id, db]);

  const handleWritingPromptsPress = async () => {
    if (!subject || !deck) return;

    // Find most recent lesson for this subject
    const lessons = await db.collections
      .get<Lesson>(LESSON_TABLE)
      .query(Q.where('subject_id', subject.id), Q.sortBy('created_at', Q.desc), Q.take(1))
      .fetch();

    if (lessons.length > 0) {
      router.push(`/lesson/${lessons[0].id}` as any);
    } else {
      // Generate a new prompt and navigate to it
      if (!geminiApiKey) {
        Alert.alert('API Key Required', 'Please set the geminiApiKey in app.config.ts');
        return;
      }

      setIsGeneratingPrompt(true);
      try {
        const newLesson = await generateNewPromptForSubject(database, subject, deck, 'learning');
        router.push(`/lesson/${newLesson.id}` as any);
      } catch (error) {
        Alert.alert('Error', 'Failed to generate prompt. Please try again.');
        console.error(error);
      } finally {
        setIsGeneratingPrompt(false);
      }
    }
  };

  const handleFlashcardsPress = () => {
    if (!deck?.id) return;
    router.push(`/set/${deck.id}` as any);
  };

  const handleDeleteSubject = () => {
    if (!subject) return;

    Alert.alert(
      'Delete Topic',
      `Are you sure you want to delete "${subject.name}"? This will remove the topic, its prompts, and vocabulary set.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                const lessons = await database.collections
                  .get<Lesson>(LESSON_TABLE)
                  .query(Q.where('subject_id', subject.id))
                  .fetch();
                for (const lesson of lessons) {
                  await lesson.destroyPermanently();
                }

                if (deck) {
                  await deck.destroyPermanently();
                }

                await subject.destroyPermanently();
              });
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete topic. Please try again.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  if (!subject) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Loading topic...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{
          title: subject.name,
          headerShown: true,
          headerBackTitle: 'Back',
          headerRight: () => <DeleteButton onPress={handleDeleteSubject} />,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats Card */}
        <Card style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>{phraseCount}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Phrases</Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[styles.statValue, { color: dueCount > 0 ? colors.primary : colors.text }]}
              >
                {dueCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Due</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {subject.level as CEFRLevel}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Level</Text>
            </View>
          </View>
        </Card>

        {/* Lesson Type Cards */}
        <View style={styles.lessonTypes}>
          <LessonTypeCard
            icon="create-outline"
            title={isGeneratingPrompt ? 'Generating...' : 'Writing Prompts'}
            stats={[
              { label: 'prompts', value: lessonCount },
              { label: 'attempts', value: attemptCount },
            ]}
            onPress={handleWritingPromptsPress}
          />

          {deck && (
            <LessonTypeCard
              icon="albums-outline"
              title="Flashcards"
              stats={[
                { label: 'phrases', value: phraseCount },
                { label: 'due', value: dueCount, highlight: dueCount > 0 },
              ]}
              onPress={handleFlashcardsPress}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 20,
  },
  statsCard: {
    padding: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  lessonTypes: {
    gap: 12,
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
});
