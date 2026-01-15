import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { TextInput } from '@/components/TextInput';
import { Languages, PARTS_OF_SPEECH } from '@/constants';
import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import { Phrase, Translation } from '@/database/models';
import { PHRASE_TABLE, TRANSLATION_TABLE } from '@/database/schema';
import { useColors } from '@/hooks';
import { translatePhrase } from '@/lib/ai/translate';

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

  const [phrase, setPhrase] = useState<Phrase | null>(null);
  const [note, setNote] = useState('');
  const [isNoteDirty, setIsNoteDirty] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [linkedPhrases, setLinkedPhrases] = useState<Phrase[]>([]);

  useEffect(() => {
    if (!id) return;

    const subscription = db.collections
      .get<Phrase>(PHRASE_TABLE)
      .findAndObserve(id)
      .subscribe((result) => {
        setPhrase(result);
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
        const linkedIds = translations.map((t) =>
          t.phrasePrimaryId === id ? t.phraseSecondaryId : t.phrasePrimaryId
        );

        if (linkedIds.length === 0) {
          setLinkedPhrases([]);
          return;
        }

        const phrases = await Promise.all(
          linkedIds.map((phraseId) =>
            db.collections
              .get<Phrase>(PHRASE_TABLE)
              .find(phraseId)
              .catch(() => null)
          )
        );

        setLinkedPhrases(phrases.filter((p): p is Phrase => p !== null));
      });

    return () => subscription.unsubscribe();
  }, [id, db]);

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

  const handleToggleFavorite = async () => {
    if (!phrase) return;
    await phrase.updateFavorite(!phrase.favorite);
  };

  const handleTranslate = async () => {
    if (!phrase || isTranslating) return;

    // Determine target language based on phrase language
    let targetLanguage: string;
    if (phrase.lang === settings.topicLanguage) {
      targetLanguage = settings.userLanguage;
    } else if (phrase.lang === settings.userLanguage) {
      targetLanguage = settings.topicLanguage;
    } else {
      targetLanguage = settings.userLanguage;
    }

    setIsTranslating(true);
    try {
      const result = await translatePhrase({
        text: phrase.text,
        targetLanguage,
      });

      // Create the translated phrase
      const newPhrase = await Phrase.addPhrase(db, {
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
      });

      // Link the phrases via Translation
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
                await phrase.destroyPermanently();
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

  const languageOptions = Languages.map((l) => ({
    value: l.code,
    label: `${l.icon} ${l.name}`,
  }));

  const partSpeechOptions = [{ value: '', label: 'None' }, ...PARTS_OF_SPEECH];

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
          headerRight: () => <DeleteButton onPress={handleDelete} />,
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.phraseHeader}>
              <Text style={[styles.phraseText, { color: colors.text }]}>{phrase.text}</Text>
              <Pressable onPress={handleToggleFavorite} hitSlop={8}>
                <Ionicons
                  name={phrase.favorite ? 'heart' : 'heart-outline'}
                  size={24}
                  color={phrase.favorite ? colors.error : colors.textSecondary}
                />
              </Pressable>
            </View>
            {language && (
              <Text style={[styles.languageText, { color: colors.textSecondary }]}>
                {language.icon} {language.name}
              </Text>
            )}
          </View>

          <Button
            title={isTranslating ? 'Translating...' : 'Translate'}
            onPress={handleTranslate}
            loading={isTranslating}
            variant="secondary"
          />

          {linkedPhrases.length > 0 && (
            <View style={styles.translationsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Translations</Text>
              {linkedPhrases.map((linkedPhrase) => {
                const linkedLang = Languages.find((l) => l.code === linkedPhrase.lang);
                return (
                  <Pressable
                    key={linkedPhrase.id}
                    style={[
                      styles.translationCard,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                    onPress={() => router.push(`/phrase/${linkedPhrase.id}` as any)}
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
                );
              })}
            </View>
          )}

          <View style={styles.form}>
            <Select
              label="Language"
              options={languageOptions}
              value={phrase.lang}
              onValueChange={handleLanguageChange}
            />

            <Select
              label="Part of Speech"
              options={partSpeechOptions}
              value={phrase.partSpeech ?? ''}
              onValueChange={handlePartSpeechChange}
            />

            <TextInput
              label="Note"
              placeholder="Add a note..."
              value={note}
              onChangeText={handleNoteChange}
              onBlur={handleNoteBlur}
              multiline
              numberOfLines={4}
              style={styles.noteInput}
            />
          </View>
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
    gap: 24,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  phraseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  phraseText: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  languageText: {
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
  translationsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  translationCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  translationText: {
    fontSize: 16,
  },
  translationLang: {
    fontSize: 13,
  },
});
