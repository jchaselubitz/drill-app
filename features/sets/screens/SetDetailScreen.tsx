import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import Constants from 'expo-constants';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card } from '@/components';
import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import { Deck, DeckTranslation, Phrase, Translation } from '@/database/models';
import {
  DECK_TABLE,
  DECK_TRANSLATION_TABLE,
  PHRASE_TABLE,
  SRS_CARD_TABLE,
  TRANSLATION_TABLE,
} from '@/database/schema';
import { useAudioPlayback, useColors, useDeckAudioStatus } from '@/hooks';
import { generatePhraseSet } from '@/lib/ai/generatePhraseSet';
import { isLanguageSupported } from '@/lib/audio/voiceMapping';
import { queueDeckAudioGeneration } from '@/lib/backgroundAudioService';
import { ensureSrsCardsForTranslation } from '@/lib/srs/cards';
import type { CEFRLevel, GeneratedPhrase, LanguageCode } from '@/types';

import { GenerateMoreSheet } from '../components/GenerateMoreSheet';

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

type PhraseItem = {
  id: string;
  primaryPhraseId: string;
  primary: string;
  secondary: string;
  partOfSpeech: string | null;
  primaryFilename: string | null;
  secondaryFilename: string | null;
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

export default function SetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { settings } = useSettings();
  const db = useDatabase();

  const [deckState, setDeckState] = useState<{ deck: Deck; _key: number } | null>(null);
  const [phrases, setPhrases] = useState<PhraseItem[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerateMore, setShowGenerateMore] = useState(false);
  const audioStatus = useDeckAudioStatus(id);
  const [audioProgress, setAudioProgress] = useState<number | null>(null);
  const [audioInitialRemaining, setAudioInitialRemaining] = useState<number | null>(null);
  const prevIsGeneratingRef = useRef(audioStatus.isGenerating);
  const { togglePlayPause, isPlayingFile } = useAudioPlayback();

  const deck = deckState?.deck ?? null;

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
            secondaryFilename: secondaryPhrase.filename,
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

    // Subscribe to deck (wrapper ensures re-render when model updates — see watermelondb-model skill)
    const deckSub = db.collections
      .get<Deck>(DECK_TABLE)
      .findAndObserve(id)
      .subscribe((result) => {
        setDeckState({ deck: result, _key: result.updatedAt });
      });

    // Subscribe to deck translations and fetch phrase data
    const translationsSub = db.collections
      .get(DECK_TRANSLATION_TABLE)
      .query(Q.where('deck_id', id))
      .observe()
      .subscribe(async () => {
        await loadPhrasesForDeck(id);
      });

    // Subscribe to due cards count
    const dueCardsSub = db.collections
      .get(SRS_CARD_TABLE)
      .query(Q.where('deck_id', id), Q.where('due_at', Q.lte(Date.now())))
      .observeCount()
      .subscribe((count) => {
        setDueCount(count);
      });

    // Initial load
    loadPhrasesForDeck(id);

    return () => {
      deckSub.unsubscribe();
      translationsSub.unsubscribe();
      dueCardsSub.unsubscribe();
    };
  }, [id, db, loadPhrasesForDeck]);

  useEffect(() => {
    const remaining = audioStatus.pendingCount + audioStatus.processingCount;

    if (audioStatus.isGenerating) {
      if (audioInitialRemaining === null && remaining > 0) {
        setAudioInitialRemaining(remaining);
      }

      if (audioInitialRemaining && audioInitialRemaining > 0) {
        const completed = Math.max(0, audioInitialRemaining - remaining);
        const progress = Math.max(0, Math.min(1, completed / audioInitialRemaining));
        setAudioProgress(progress);
      }
    } else {
      setAudioInitialRemaining(null);
      setAudioProgress(null);
    }

    const wasGenerating = prevIsGeneratingRef.current;
    if (wasGenerating && !audioStatus.isGenerating && id) {
      // Audio generation just finished – refresh phrases so play buttons appear
      loadPhrasesForDeck(id);
    }

    prevIsGeneratingRef.current = audioStatus.isGenerating;
  }, [audioStatus, audioInitialRemaining, id, loadPhrasesForDeck]);

  const handleStartReview = () => {
    router.push(`/review/session?deckId=${id}` as any);
  };

  const handleGenerateMore = async (count: number) => {
    if (!deck || !geminiApiKey) {
      Alert.alert('Error', 'Unable to generate more phrases');
      return;
    }

    setShowGenerateMore(false);
    setIsLoading(true);

    try {
      const existingPhrases = phrases.map((p) => p.primary);

      const newPhrases = await generatePhraseSet({
        topic: deck.topic ?? deck.name,
        primaryLanguage: (deck.primaryLang ?? settings.topicLanguage) as LanguageCode,
        secondaryLanguage: (deck.secondaryLang ?? settings.userLanguage) as LanguageCode,
        level: (deck.level ?? settings.level) as CEFRLevel,
        count,
        existingPhrases,
      });

      // Save the new phrases
      await savePhrases(newPhrases);

      Alert.alert('Success', `Added ${newPhrases.length} new phrases to the set`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate more phrases. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const savePhrases = async (generatedPhrases: GeneratedPhrase[]) => {
    if (!deck) return;

    const primaryLang = deck.primaryLang ?? settings.topicLanguage;
    const secondaryLang = deck.secondaryLang ?? settings.userLanguage;

    for (const phrase of generatedPhrases) {
      // Create or find primary phrase (target language)
      const primaryPhrase = await Phrase.findOrCreatePhrase(database, {
        text: phrase.primary,
        lang: primaryLang,
        source: 'ai_generated',
        partSpeech: phrase.partOfSpeech ?? null,
        favorite: false,
        filename: null,
        type: 'word',
        note: null,
        difficulty: null,
        historyId: null,
        attemptId: null,
      });

      // Create or find secondary phrase (user's language)
      const secondaryPhrase = await Phrase.findOrCreatePhrase(database, {
        text: phrase.secondary,
        lang: secondaryLang,
        source: 'ai_generated',
        partSpeech: phrase.partOfSpeech ?? null,
        favorite: false,
        filename: null,
        type: 'word',
        note: null,
        difficulty: null,
        historyId: null,
        attemptId: null,
      });

      // Create translation linking the phrases
      const translation = await Translation.addTranslation(database, {
        phrasePrimaryId: primaryPhrase.id,
        phraseSecondaryId: secondaryPhrase.id,
      });

      // Create deck translation link
      await database.write(async () => {
        await database.collections.get(DECK_TRANSLATION_TABLE).create((dt: any) => {
          dt.deckId = deck.id;
          dt.translationId = translation.id;
          dt.createdAt = Date.now();
          dt.updatedAt = Date.now();
        });
      });

      // Create SRS cards for both directions
      await ensureSrsCardsForTranslation(database, {
        deckId: deck.id,
        translationId: translation.id,
        nowMs: Date.now(),
      });
    }
  };

  const handleDeleteSet = () => {
    if (!deck) return;

    Alert.alert(
      'Delete Phrase Set',
      `Are you sure you want to delete "${deck.name}"? This will remove the deck but keep the phrases in your library.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await deck.destroyPermanently();
              });
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete set. Please try again.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  const handleGenerateAudio = async () => {
    if (!deck || !id) return;

    const primaryLang = (deck.primaryLang ?? settings.topicLanguage) as LanguageCode;

    if (!isLanguageSupported(primaryLang)) {
      Alert.alert('Not Supported', `Audio generation is not available for this language yet.`);
      return;
    }

    if (phrases.length === 0) {
      Alert.alert('No Phrases', 'Add some phrases first before generating audio.');
      return;
    }

    // Collect phrase data for audio generation
    const phraseData = phrases.map((p) => ({
      phraseId: p.primaryPhraseId,
      phraseText: p.primary,
    }));

    try {
      const queuedCount = await queueDeckAudioGeneration(db, id, primaryLang, phraseData);

      if (queuedCount === 0) {
        Alert.alert('Complete', 'All phrases already have audio.');
      } else {
        Alert.alert(
          'Audio Generation Started',
          `Generating audio for ${queuedCount} phrases. This will continue in the background.`
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start audio generation. Please try again.');
      console.error('Audio generation error:', error);
    }
  };

  const renderPhraseItem = ({ item }: { item: PhraseItem }) => {
    const primaryHasAudio = item.primaryFilename !== null;
    const secondaryHasAudio = item.secondaryFilename !== null;
    const isPrimaryPlaying = primaryHasAudio && isPlayingFile(item.primaryFilename!);
    const isSecondaryPlaying = secondaryHasAudio && isPlayingFile(item.secondaryFilename!);

    return (
      <View style={[styles.phraseItem, { borderBottomColor: colors.border }]}>
        <View style={styles.phraseContent}>
          <View style={styles.phraseRow}>
            <Text
              style={[styles.primaryText, styles.phraseText, { color: colors.text }]}
              selectable
            >
              {item.primary}
            </Text>
            {primaryHasAudio && (
              <Pressable
                onPress={() => togglePlayPause(item.primaryFilename!)}
                style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.5 : 1 }]}
              >
                <Ionicons
                  name={isPrimaryPlaying ? 'pause' : 'play'}
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            )}
          </View>
          <View style={styles.phraseRow}>
            <Text
              style={[styles.secondaryText, styles.phraseText, { color: colors.textSecondary }]}
              selectable
            >
              {item.secondary}
            </Text>
            {secondaryHasAudio && (
              <Pressable
                onPress={() => togglePlayPause(item.secondaryFilename!)}
                style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.5 : 1 }]}
              >
                <Ionicons
                  name={isSecondaryPlaying ? 'pause' : 'play'}
                  size={18}
                  color={colors.primary}
                />
              </Pressable>
            )}
          </View>
          {item.partOfSpeech && (
            <Text style={[styles.partOfSpeech, { color: colors.primary }]}>
              {item.partOfSpeech}
            </Text>
          )}
        </View>
      </View>
    );
  };

  if (!deck) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Loading set...</Text>
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
          title: deck.name,
          headerShown: true,
          headerBackTitle: 'Back',
          headerRight: () => <DeleteButton onPress={handleDeleteSet} disabled={isLoading} />,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />

      <FlatList
        data={phrases}
        renderItem={renderPhraseItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View style={styles.header}>
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
                {deck.level && (
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{deck.level}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Level</Text>
                  </View>
                )}
              </View>
            </Card>

            <View style={styles.actions}>
              {dueCount > 0 && (
                <Button
                  text={`Review ${dueCount} cards`}
                  onPress={handleStartReview}
                  buttonState={isLoading ? 'disabled' : 'default'}
                />
              )}
              <View style={styles.buttonRow}>
                <View style={styles.buttonHalf}>
                  <Button
                    text="Generate More"
                    variant="secondary"
                    onPress={() => setShowGenerateMore(true)}
                    buttonState={isLoading ? 'loading' : 'default'}
                    loadingText="Generating..."
                  />
                </View>
                <View style={styles.buttonHalf}>
                  <Button
                    text="Generate Audio"
                    variant="secondary"
                    onPress={handleGenerateAudio}
                    buttonState={isLoading ? 'disabled' : 'default'}
                  />
                </View>
              </View>
              {audioStatus.isGenerating && (
                <View style={[styles.audioStatusContainer, { backgroundColor: colors.card }]}>
                  <View style={styles.audioStatusHeader}>
                    <Ionicons name="volume-high" size={16} color={colors.primary} />
                    <Text style={[styles.audioStatusText, { color: colors.textSecondary }]}>
                      Generating audio
                    </Text>
                    <Text style={[styles.audioStatusMetaText, { color: colors.textSecondary }]}>
                      {audioStatus.pendingCount + audioStatus.processingCount} remaining
                    </Text>
                  </View>
                  {audioProgress !== null && (
                    <View style={[styles.audioProgressTrack, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.audioProgressFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${Math.round(audioProgress * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>Phrases</Text>
          </View>
        )}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No phrases yet. Tap "Generate More" to add phrases.
            </Text>
          </View>
        )}
      />

      <GenerateMoreSheet
        visible={showGenerateMore}
        onClose={() => setShowGenerateMore(false)}
        onGenerate={handleGenerateMore}
      />
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
  listContent: {
    padding: 16,
  },
  header: {
    gap: 16,
    marginBottom: 16,
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
  actions: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonHalf: {
    flex: 1,
  },
  audioStatusContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  audioStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  audioStatusText: {
    fontSize: 13,
  },
  audioStatusMetaText: {
    fontSize: 12,
  },
  audioProgressTrack: {
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  audioProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 8,
  },
  phraseItem: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  phraseContent: {
    flex: 1,
    gap: 2,
  },
  phraseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phraseText: {
    flex: 1,
  },
  playButton: {
    padding: 6,
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
  emptyState: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
});
