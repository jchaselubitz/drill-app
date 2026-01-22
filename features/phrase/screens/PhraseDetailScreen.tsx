import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { FavoriteButton } from '@/components/FavoriteButton';
import { MetadataChip } from '@/components/MetadataChip';
import { Select } from '@/components/Select';
import { Languages, PARTS_OF_SPEECH } from '@/constants';
import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import { Deck, DeckTranslation, Phrase, SrsCard, Translation } from '@/database/models';
import {
  DECK_TABLE,
  DECK_TRANSLATION_TABLE,
  PHRASE_TABLE,
  SRS_CARD_TABLE,
  TRANSLATION_TABLE,
} from '@/database/schema';
import { useAudioPlayback, useColors } from '@/hooks';
import { translatePhrase } from '@/lib/ai/translate';
import { ensureSrsCardsForTranslation } from '@/lib/srs/cards';

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

export default function PhraseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const db = useDatabase();
  const { settings } = useSettings();
  const { togglePlayPause, isPlayingFile } = useAudioPlayback();

  const [phraseState, setPhraseState] = useState<{ phrase: Phrase; _key: number } | null>(null);
  const [note, setNote] = useState('');
  const [isNoteDirty, setIsNoteDirty] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [linkedTranslations, setLinkedTranslations] = useState<
    { translation: Translation; phrase: Phrase }[]
  >([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckAssignments, setDeckAssignments] = useState<Record<string, string | null>>({});
  const [targetLanguage, setTargetLanguage] = useState<string>(settings.topicLanguage);

  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<any>(null);

  const phrase = phraseState?.phrase ?? null;

  useEffect(() => {
    Deck.getOrCreateDefault(db).catch((error) => {
      console.error('Failed to ensure default deck:', error);
    });

    const subscription = db.collections
      .get<Deck>(DECK_TABLE)
      .query(Q.where('archived', false))
      .observe()
      .subscribe((results) => {
        setDecks(results);
      });

    return () => subscription.unsubscribe();
  }, [db]);

  useEffect(() => {
    if (!id) return;

    const subscription = db.collections
      .get<Phrase>(PHRASE_TABLE)
      .findAndObserve(id)
      .subscribe((result) => {
        setPhraseState({ phrase: result, _key: result.updatedAt });
        if (!isNoteDirty) {
          setNote(result.note ?? '');
        }
      });

    return () => subscription.unsubscribe();
  }, [id, db, isNoteDirty]);

  // Fetch linked translations
  useEffect(() => {
    if (!id) return;

    const subscription = db.collections
      .get<Translation>(TRANSLATION_TABLE)
      .query(Q.or(Q.where('phrase_primary_id', id), Q.where('phrase_secondary_id', id)))
      .observe()
      .subscribe(async (translations) => {
        try {
          if (translations.length === 0) {
            setLinkedTranslations([]);
            setDeckAssignments({});
            return;
          }

          const linked = await Promise.all(
            translations.map(async (translation) => {
              const linkedId =
                translation.phrasePrimaryId === id
                  ? translation.phraseSecondaryId
                  : translation.phrasePrimaryId;
              const linkedPhrase = await db.collections
                .get<Phrase>(PHRASE_TABLE)
                .find(linkedId)
                .catch(() => null);
              return linkedPhrase ? { translation, phrase: linkedPhrase } : null;
            })
          );

          setLinkedTranslations(
            linked.filter(
              (item): item is { translation: Translation; phrase: Phrase } => item !== null
            )
          );

          const translationIds = translations.map((t) => t.id);
          if (translationIds.length > 0) {
            const deckTranslations = await db.collections
              .get<DeckTranslation>(DECK_TRANSLATION_TABLE)
              .query(Q.where('translation_id', Q.oneOf(translationIds)))
              .fetch();

            const assignments: Record<string, string | null> = {};
            deckTranslations.forEach((deckTranslation) => {
              assignments[deckTranslation.translationId] = deckTranslation.deckId;
            });
            setDeckAssignments(assignments);
          } else {
            setDeckAssignments({});
          }
        } catch (error) {
          console.error('Error loading translations:', error);
          setLinkedTranslations([]);
          setDeckAssignments({});
        }
      });

    return () => subscription.unsubscribe();
  }, [id, db]);

  // Update target language when phrase or linked phrases change
  useEffect(() => {
    if (!phrase) return;

    const excludedLanguages = new Set([
      phrase.lang,
      ...linkedTranslations.map((item) => item.phrase.lang),
    ]);

    setTargetLanguage((currentTarget) => {
      if (excludedLanguages.has(currentTarget)) {
        const availableLanguages = Languages.filter((l) => !excludedLanguages.has(l.code));
        if (availableLanguages.length > 0) {
          return (
            availableLanguages.find((l) => l.code === settings.topicLanguage)?.code ??
            availableLanguages[0].code
          );
        }
      }
      return currentTarget;
    });
  }, [phrase, linkedTranslations, settings.topicLanguage]);

  const handleLanguageChange = async (newLang: string) => {
    if (!phrase) return;
    await phrase.updateLang(newLang);
  };

  const handlePartSpeechChange = async (newPartSpeech: string) => {
    if (!phrase) return;
    await phrase.updatePartSpeech(newPartSpeech || null);
  };

  const handleNoteChange = (text: string) => {
    setNote(text);
    setIsNoteDirty(true);
  };

  const handleNoteBlur = async () => {
    if (!phrase || !isNoteDirty) return;
    await phrase.updateNote(note.trim() || null);
    setIsNoteDirty(false);
  };

  const handleStartEditText = () => {
    if (!phrase) return;
    setEditedText(phrase.text);
    setIsEditingText(true);
    setTimeout(() => {
      textInputRef.current?.focus();
    }, 50);
  };

  const handleSaveText = async () => {
    if (!phrase) return;
    const trimmedText = editedText.trim();
    if (trimmedText && trimmedText !== phrase.text) {
      try {
        await phrase.updateText(trimmedText);
      } catch (error) {
        Alert.alert('Error', 'Failed to update phrase text.');
        console.error(error);
      }
    }
    setIsEditingText(false);
  };

  const handleTranslate = async () => {
    if (!phrase || isTranslating) return;

    setIsTranslating(true);
    try {
      const result = await translatePhrase({
        text: phrase.text,
        targetLanguage,
      });

      const newPhrase = await Phrase.findOrCreatePhrase(db, {
        text: result.output_text,
        lang: result.output_lang,
        source: 'translation',
        partSpeech: phrase.partSpeech,
        favorite: false,
        filename: null,
        type: phrase.type,
        note: null,
        difficulty: null,
        historyId: null,
        attemptId: null,
      });

      await Translation.addTranslation(db, {
        phrasePrimaryId: phrase.id,
        phraseSecondaryId: newPhrase.id,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to translate phrase. Please try again.');
      console.error(error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDeckAssignment = async (translationId: string, deckId: string) => {
    const nowMs = Date.now();
    const selectedDeckId = deckId || null;

    const existingDeckTranslations = await db.collections
      .get<DeckTranslation>(DECK_TRANSLATION_TABLE)
      .query(Q.where('translation_id', translationId))
      .fetch();

    const existingCards = await db.collections
      .get<SrsCard>(SRS_CARD_TABLE)
      .query(Q.where('translation_id', translationId))
      .fetch();

    await db.write(async () => {
      if (!selectedDeckId) {
        for (const deckTranslation of existingDeckTranslations) {
          await deckTranslation.destroyPermanently();
        }
        for (const card of existingCards) {
          await card.destroyPermanently();
        }
        return;
      }

      if (existingDeckTranslations.length > 0) {
        const current = existingDeckTranslations[0];
        if (current.deckId !== selectedDeckId) {
          await current.update((deckTranslation) => {
            deckTranslation.deckId = selectedDeckId;
            deckTranslation.updatedAt = nowMs;
          });
        }
      } else {
        await db.collections.get<DeckTranslation>(DECK_TRANSLATION_TABLE).create((record) => {
          record.translationId = translationId;
          record.deckId = selectedDeckId;
          record.createdAt = nowMs;
          record.updatedAt = nowMs;
        });
      }

      if (existingCards.length === 0) {
        await ensureSrsCardsForTranslation(db, {
          deckId: selectedDeckId,
          translationId,
          nowMs,
        });
      } else {
        for (const card of existingCards) {
          await card.update((record) => {
            record.deckId = selectedDeckId;
            record.updatedAt = nowMs;
          });
        }
      }
    });

    setDeckAssignments((prev) => ({ ...prev, [translationId]: selectedDeckId }));
  };

  const handleDelete = () => {
    if (!phrase) return;

    Alert.alert(
      'Delete Phrase',
      `Are you sure you want to delete "${phrase.text}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                await phrase.deleteWithAudio();
              });
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete phrase. Please try again.');
              console.error(error);
            }
          },
        },
      ]
    );
  };

  // Build options for dropdowns
  const languageOptions = Languages.map((l) => ({
    value: l.code,
    label: `${l.icon} ${l.name}`,
  }));

  const partSpeechOptions = [{ value: '', label: 'None' }, ...PARTS_OF_SPEECH];

  const excludedLanguages = phrase
    ? new Set([phrase.lang, ...linkedTranslations.map((item) => item.phrase.lang)])
    : new Set<string>();
  const availableLanguages = Languages.filter((l) => !excludedLanguages.has(l.code));
  const translationLanguageOptions = availableLanguages.map((l) => ({
    value: l.code,
    label: `${l.icon} ${l.name}`,
  }));

  if (!phrase) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Loading phrase...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const language = Languages.find((l) => l.code === phrase.lang);
  const deckOptions = [{ value: '', label: 'Not in a deck' }].concat(
    decks.map((deck) => ({ value: deck.id, label: deck.name }))
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{
          title: 'Phrase',
          headerShown: true,
          headerBackTitle: 'Library',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          headerRight: () => <DeleteButton onPress={handleDelete} />,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          {/* Phrase Header Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.phraseHeader}>
              {isEditingText ? (
                <RNTextInput
                  ref={textInputRef}
                  style={[styles.phraseText, styles.phraseTextInput, { color: colors.text }]}
                  value={editedText}
                  onChangeText={setEditedText}
                  onBlur={handleSaveText}
                  autoFocus
                  multiline
                  returnKeyType="done"
                  blurOnSubmit
                />
              ) : (
                <Pressable onPress={handleStartEditText} style={styles.phraseTextPressable}>
                  <Text style={[styles.phraseText, { color: colors.text }]} selectable>
                    {phrase.text}
                  </Text>
                </Pressable>
              )}
              <View style={styles.phraseActions}>
                {phrase.filename && (
                  <Pressable
                    onPress={() => togglePlayPause(phrase.filename!)}
                    hitSlop={8}
                    style={({ pressed }) => [{ opacity: pressed ? 0.5 : 1 }]}
                  >
                    <Ionicons
                      name={isPlayingFile(phrase.filename) ? 'pause' : 'play'}
                      size={24}
                      color={colors.primary}
                    />
                  </Pressable>
                )}
                <FavoriteButton phrase={phrase} size={24} hitSlop={8} />
              </View>
            </View>

            {/* Inline Metadata Chips */}
            <View style={styles.metadataRow}>
              <MetadataChip
             
                label="Language"
                options={languageOptions}
                value={phrase.lang}
                onValueChange={handleLanguageChange}
              />
              <MetadataChip
                iconName="pricetag-outline"
                label="Part of Speech"
                options={partSpeechOptions}
                value={phrase.partSpeech ?? ''}
                onValueChange={handlePartSpeechChange}
                showLabel={true}
              />
            </View>
          </View>

          {/* Translations Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TRANSLATIONS</Text>

            {linkedTranslations.length === 0 ? (
              /* Empty State */
              <View
                style={[
                  styles.emptyState,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Ionicons name="language-outline" size={32} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No translations yet
                </Text>
              </View>
            ) : (
              /* Translation Cards */
              linkedTranslations.map(({ translation, phrase: linkedPhrase }) => {
                const linkedLang = Languages.find((l) => l.code === linkedPhrase.lang);
                const deckAssignment = deckAssignments[translation.id] ?? '';
                return (
                  <View
                    key={translation.id}
                    style={[
                      styles.translationCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Pressable
                      onPress={() => router.push(`/phrase/${linkedPhrase.id}` as any)}
                      style={styles.translationContent}
                    >
                      <Text style={[styles.translationText, { color: colors.text }]}>
                        {linkedPhrase.text}
                      </Text>
                      {linkedLang && (
                        <Text style={[styles.translationLang, { color: colors.textSecondary }]}>
                          {linkedLang.icon} {linkedLang.name}
                        </Text>
                      )}
                    </Pressable>
                    {deckOptions.length > 1 && (
                      <View style={styles.deckSelect}>
                        <Select
                          label="Deck"
                          options={deckOptions}
                          value={deckAssignment}
                          onValueChange={(value: string) =>
                            handleDeckAssignment(translation.id, value)
                          }
                        />
                      </View>
                    )}
                  </View>
                );
              })
            )}

            {/* Add Translation Row */}
            {translationLanguageOptions.length > 0 && (
              <Pressable
                style={[
                  styles.addTranslationRow,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                onPress={handleTranslate}
                disabled={isTranslating}
              >
                <View style={styles.addTranslationLeft}>
                  {isTranslating ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                  )}
                  <Text style={[styles.addTranslationText, { color: colors.primary }]}>
                    {isTranslating ? 'Translating...' : 'Add Translation'}
                  </Text>
                </View>
                <View style={styles.addTranslationRight}>
                  <Pressable onPress={(e) => e.stopPropagation()} style={styles.targetLanguageChip}>
                    <MetadataChip
                      label="Target Language"
                      options={translationLanguageOptions}
                      value={targetLanguage}
                      onValueChange={setTargetLanguage}
                    />
                  </Pressable>
                </View>
              </Pressable>
            )}
          </View>

          {/* Notes Section */}
          <CollapsibleSection
            title="Notes"
            icon="document-text-outline"
            defaultExpanded={!!note}
            preview={note || 'Add a note...'}
          >
            <RNTextInput
              style={[styles.noteInput, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="Add a note about this phrase..."
              placeholderTextColor={colors.textSecondary}
              value={note}
              onChangeText={handleNoteChange}
              onBlur={handleNoteBlur}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </CollapsibleSection>
        </ScrollView>
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
    paddingBottom: 32,
    gap: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  phraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  phraseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phraseText: {
    fontSize: 22,
    fontWeight: '600',
    flex: 1,
    lineHeight: 30,
  },
  phraseTextPressable: {
    flex: 1,
  },
  phraseTextInput: {
    padding: 0,
    margin: 0,
    minHeight: 30,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
  },
  emptyStateText: {
    fontSize: 14,
  },
  translationCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  translationContent: {
    gap: 4,
  },
  translationText: {
    fontSize: 16,
    fontWeight: '500',
  },
  translationLang: {
    fontSize: 13,
  },
  deckSelect: {
    marginTop: 4,
  },
  addTranslationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  addTranslationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTranslationText: {
    fontSize: 15,
    fontWeight: '500',
  },
  addTranslationRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetLanguageChip: {
    // Allow chip to be interactive within the pressable row
  },
  noteInput: {
    minHeight: 80,
    padding: 12,
    borderRadius: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
});
