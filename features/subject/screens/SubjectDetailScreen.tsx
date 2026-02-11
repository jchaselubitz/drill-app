import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import Constants from 'expo-constants';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card } from '@/components';
import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import {
  Attempt,
  Deck,
  DeckTranslation,
  Lesson,
  Phrase,
  Subject,
  Translation,
} from '@/database/models';
import type { PromptLanguageType } from '@/database/models/Lesson';
import {
  ATTEMPT_TABLE,
  DECK_TABLE,
  DECK_TRANSLATION_TABLE,
  LESSON_TABLE,
  PHRASE_TABLE,
  SUBJECT_TABLE,
  TRANSLATION_TABLE,
} from '@/database/schema';
import { useAudioPlayback, useColors, useDeckDueCount } from '@/hooks';
import { generateNewPromptForSubject } from '@/lib/services/subjectService';
import { submitAttemptForReview } from '@/lib/backgroundReviewService';
import type { CEFRLevel, LanguageCode } from '@/types';

import { SubjectPromptCard } from '../components/SubjectPromptCard';
import { AttemptForm } from '@/features/lesson/components';

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

type PhraseItem = {
  id: string;
  primaryPhraseId: string;
  primary: string;
  secondary: string;
  partOfSpeech: string | null;
  primaryFilename: string | null;
};

function DeleteButton({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.deleteButton, { opacity: pressed ? 0.5 : 1 }]}
      disabled={disabled}
    >
      <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { settings, updateSettings } = useSettings();
  const db = useDatabase();

  const [subjectState, setSubjectState] = useState<{ subject: Subject; _key: number } | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [phrases, setPhrases] = useState<PhraseItem[]>([]);

  const [paragraph, setParagraph] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const { togglePlayPause, isPlayingFile } = useAudioPlayback();

  const subject = subjectState?.subject ?? null;
  const { dueCount } = useDeckDueCount(deck?.id ?? null);

  const loadPhrasesForDeck = useCallback(
    async (deckId: string) => {
      const deckTranslations = await db.collections
        .get(DECK_TRANSLATION_TABLE)
        .query(Q.where('deck_id', deckId))
        .fetch();

      const phraseItems: PhraseItem[] = [];

      for (const dt of deckTranslations as DeckTranslation[]) {
        try {
          const translation = await db.collections
            .get<Translation>(TRANSLATION_TABLE)
            .find(dt.translationId);

          const primaryPhrase = await db.collections
            .get<Phrase>(PHRASE_TABLE)
            .find(translation.phrasePrimaryId);

          const secondaryPhrase = await db.collections
            .get<Phrase>(PHRASE_TABLE)
            .find(translation.phraseSecondaryId);

          phraseItems.push({
            id: dt.id,
            primaryPhraseId: primaryPhrase.id,
            primary: primaryPhrase.text,
            secondary: secondaryPhrase.text,
            partOfSpeech: primaryPhrase.partSpeech,
            primaryFilename: primaryPhrase.filename,
          });
        } catch (error) {
          console.error('Error fetching phrase:', error);
        }
      }

      setPhrases(phraseItems);
    },
    [db]
  );

  useEffect(() => {
    if (!id) return;

    // Subscribe to subject
    const subjectSub = db.collections
      .get<Subject>(SUBJECT_TABLE)
      .findAndObserve(id)
      .subscribe((result) => {
        setSubjectState({ subject: result, _key: result.updatedAt });
      });

    return () => {
      subjectSub.unsubscribe();
    };
  }, [id, db]);

  // Load deck when subject changes
  useEffect(() => {
    if (!subject?.deckId) return;

    const deckSub = db.collections
      .get<Deck>(DECK_TABLE)
      .findAndObserve(subject.deckId)
      .subscribe((result) => {
        setDeck(result);
      });

    // Load phrases
    loadPhrasesForDeck(subject.deckId);

    // Subscribe to deck translations for changes
    const translationsSub = db.collections
      .get(DECK_TRANSLATION_TABLE)
      .query(Q.where('deck_id', subject.deckId))
      .observe()
      .subscribe(async () => {
        await loadPhrasesForDeck(subject.deckId!);
      });

    return () => {
      deckSub.unsubscribe();
      translationsSub.unsubscribe();
    };
  }, [subject?.deckId, db, loadPhrasesForDeck]);

  // Load most recent lesson for this subject
  useEffect(() => {
    if (!id) return;

    const lessonSub = db.collections
      .get<Lesson>(LESSON_TABLE)
      .query(Q.where('subject_id', id), Q.sortBy('created_at', Q.desc), Q.take(1))
      .observe()
      .subscribe((results) => {
        if (results.length > 0) {
          setCurrentLesson(results[0]);
        }
      });

    return () => {
      lessonSub.unsubscribe();
    };
  }, [id, db]);

  // Load attempts for current lesson
  useEffect(() => {
    if (!currentLesson?.id) return;

    const attemptsSub = db.collections
      .get<Attempt>(ATTEMPT_TABLE)
      .query(Q.where('lesson_id', currentLesson.id), Q.sortBy('created_at', Q.desc))
      .observe()
      .subscribe((results) => {
        setAttempts(results);
      });

    return () => {
      attemptsSub.unsubscribe();
    };
  }, [currentLesson?.id, db]);

  const handleGenerateNewPrompt = async (promptType: PromptLanguageType) => {
    if (!subject || !deck) return;

    if (!geminiApiKey) {
      Alert.alert('API Key Required', 'Please set the geminiApiKey in app.config.ts');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const newLesson = await generateNewPromptForSubject(database, subject, deck, promptType);
      setCurrentLesson(newLesson);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate new prompt. Please try again.');
      console.error(error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (isSubmitting) return;
    if (!paragraph.trim() || !currentLesson) {
      Alert.alert('Error', 'Please write something to submit');
      return;
    }

    if (!geminiApiKey) {
      Alert.alert('API Key Required', 'Please set the geminiApiKey in app.config.ts');
      return;
    }

    const controller = new AbortController();
    setAbortController(controller);
    setIsSubmitting(true);

    try {
      await submitAttemptForReview({
        db: database,
        lessonId: currentLesson.id,
        paragraph,
        topicLanguage: settings.topicLanguage as LanguageCode,
        userLanguage: subject?.secondaryLang as LanguageCode,
        level: currentLesson.level,
        abortSignal: controller.signal,
      });

      setParagraph('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit attempt. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAttempt = () => {
    abortController?.abort();
    setAbortController(null);
  };

  const handleStartReview = async () => {
    if (!deck?.id) return;
    if (settings.activeDeckId !== deck.id) {
      await updateSettings({ activeDeckId: deck.id });
    }
    router.push(`/review/session?deckId=${deck.id}` as any);
  };

  const handleViewVocabulary = () => {
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
                // Delete associated lessons
                const lessons = await database.collections
                  .get<Lesson>(LESSON_TABLE)
                  .query(Q.where('subject_id', subject.id))
                  .fetch();
                for (const lesson of lessons) {
                  await lesson.destroyPermanently();
                }

                // Delete deck if exists
                if (deck) {
                  await deck.destroyPermanently();
                }

                // Delete subject
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

  const renderPhrasePreview = ({ item }: { item: PhraseItem }) => {
    const hasAudio = item.primaryFilename !== null;
    const isPlaying = hasAudio && isPlayingFile(item.primaryFilename!);

    return (
      <View style={[styles.phrasePreviewItem, { backgroundColor: colors.card }]}>
        <View style={styles.phrasePreviewContent}>
          <Text style={[styles.phrasePreviewPrimary, { color: colors.text }]} numberOfLines={1}>
            {item.primary}
          </Text>
          <Text
            style={[styles.phrasePreviewSecondary, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {item.secondary}
          </Text>
        </View>
        {hasAudio && (
          <Pressable
            onPress={() => togglePlayPause(item.primaryFilename!)}
            style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.5 : 1 }]}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={colors.primary} />
          </Pressable>
        )}
      </View>
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
          headerRight: () => (
            <DeleteButton onPress={handleDeleteSubject} disabled={isSubmitting} />
          ),
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <FlatList
          data={[]}
          renderItem={null}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
          ListHeaderComponent={() => (
            <View style={styles.mainContent}>
              {/* Stats Card */}
              <Card style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{phrases.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Phrases</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text
                      style={[
                        styles.statValue,
                        { color: dueCount > 0 ? colors.primary : colors.text },
                      ]}
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

              {/* Current Prompt */}
              {currentLesson && (
                <SubjectPromptCard
                  lesson={currentLesson}
                  isGenerating={isGeneratingPrompt}
                  onGenerateNew={handleGenerateNewPrompt}
                />
              )}

              {/* Writing Form */}
              {currentLesson && (
                <AttemptForm
                  paragraph={paragraph}
                  onChangeText={setParagraph}
                  onSubmit={handleSubmitAttempt}
                  isLoading={isSubmitting}
                  onCancel={handleCancelAttempt}
                />
              )}

              {/* Vocabulary Section */}
              <View style={styles.vocabularySection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Vocabulary</Text>
                  <Pressable onPress={handleViewVocabulary}>
                    <Text style={[styles.viewAllLink, { color: colors.primary }]}>View All</Text>
                  </Pressable>
                </View>

                {dueCount > 0 && (
                  <Button
                    text={`Review ${dueCount} cards`}
                    onPress={handleStartReview}
                    buttonState="default"
                  />
                )}

                <FlatList
                  data={phrases.slice(0, 6)}
                  renderItem={renderPhrasePreview}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.phrasePreviewList}
                />
              </View>

              {/* Recent Attempts */}
              {attempts.length > 0 && (
                <View style={styles.attemptsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Attempts</Text>
                  <Text style={[styles.attemptCount, { color: colors.textSecondary }]}>
                    {attempts.length} attempt{attempts.length !== 1 ? 's' : ''} on this prompt
                  </Text>
                </View>
              )}
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  mainContent: {
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
  vocabularySection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  phrasePreviewList: {
    gap: 10,
  },
  phrasePreviewItem: {
    padding: 12,
    borderRadius: 10,
    minWidth: 140,
    maxWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phrasePreviewContent: {
    flex: 1,
    gap: 2,
  },
  phrasePreviewPrimary: {
    fontSize: 14,
    fontWeight: '500',
  },
  phrasePreviewSecondary: {
    fontSize: 12,
  },
  playButton: {
    padding: 4,
  },
  attemptsSection: {
    gap: 8,
  },
  attemptCount: {
    fontSize: 14,
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
});
