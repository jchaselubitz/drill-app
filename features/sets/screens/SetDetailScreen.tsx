import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import Constants from 'expo-constants';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { useColors } from '@/hooks';
import { generatePhraseSet } from '@/lib/ai/generatePhraseSet';
import { ensureSrsCardsForTranslation } from '@/lib/srs/cards';
import type { CEFRLevel, GeneratedPhrase, LanguageCode } from '@/types';

import { GenerateMoreSheet } from '../components/GenerateMoreSheet';

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

type PhraseItem = {
  id: string;
  primary: string;
  secondary: string;
  partOfSpeech: string | null;
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

  const [deck, setDeck] = useState<Deck | null>(null);
  const [phrases, setPhrases] = useState<PhraseItem[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showGenerateMore, setShowGenerateMore] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Subscribe to deck
    const deckSub = db.collections
      .get<Deck>(DECK_TABLE)
      .findAndObserve(id)
      .subscribe((result) => {
        setDeck(result);
      });

    // Subscribe to deck translations and fetch phrase data
    const translationsSub = db.collections
      .get(DECK_TRANSLATION_TABLE)
      .query(Q.where('deck_id', id))
      .observe()
      .subscribe(async (deckTranslations) => {
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
              primary: primaryPhrase.text,
              secondary: secondaryPhrase.text,
              partOfSpeech: primaryPhrase.partSpeech,
            });
          } catch (error) {
            console.error('Error fetching phrase:', error);
          }
        }

        setPhrases(phraseItems);
      });

    // Subscribe to due cards count
    const dueCardsSub = db.collections
      .get(SRS_CARD_TABLE)
      .query(Q.where('deck_id', id), Q.where('due_at', Q.lte(Date.now())))
      .observeCount()
      .subscribe((count) => {
        setDueCount(count);
      });

    return () => {
      deckSub.unsubscribe();
      translationsSub.unsubscribe();
      dueCardsSub.unsubscribe();
    };
  }, [id, db]);

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

  const renderPhraseItem = ({ item }: { item: PhraseItem }) => (
    <View style={[styles.phraseItem, { borderBottomColor: colors.border }]}>
      <View style={styles.phraseContent}>
        <Text style={[styles.primaryText, { color: colors.text }]} selectable>
          {item.primary}
        </Text>
        <Text style={[styles.secondaryText, { color: colors.textSecondary }]} selectable>
          {item.secondary}
        </Text>
        {item.partOfSpeech && (
          <Text style={[styles.partOfSpeech, { color: colors.primary }]}>{item.partOfSpeech}</Text>
        )}
      </View>
    </View>
  );

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
              <Button
                text="Generate More"
                variant="secondary"
                onPress={() => setShowGenerateMore(true)}
                buttonState={isLoading ? 'loading' : 'default'}
                loadingText="Generating..."
              />
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
    gap: 2,
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
