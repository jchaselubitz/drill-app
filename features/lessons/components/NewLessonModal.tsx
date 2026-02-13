import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import { Deck, Lesson, Phrase, Translation } from '@/database/models';
import { DECK_TRANSLATION_TABLE } from '@/database/schema';
import { useNewLessonModal } from '@/features/lessons/context/NewLessonModalContext';
import { useColors } from '@/hooks';
import { generatePhraseSet } from '@/lib/ai/generatePhraseSet';
import { changePromptLength, generateTutorPrompt } from '@/lib/ai/tutor';
import { createUnifiedSubject } from '@/lib/services/subjectService';
import { ensureSrsCardsForTranslation } from '@/lib/srs/cards';
import type { GeneratedPhrase, PhraseType } from '@/types';

import { LessonSettingsDisplay } from './LessonSettingsDisplay';
import { ModalHeader } from './ModalHeader';
import { NewLessonForm } from './NewLessonForm';
import { NewSetForm } from './NewSetForm';
import { PromptCard } from './PromptCard';
import { SetPreviewCard } from './SetPreviewCard';

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

type ModalMode = 'unified' | 'lesson' | 'set';

type NewLessonModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function NewLessonModal({ visible, onClose }: NewLessonModalProps) {
  const colors = useColors();
  const router = useRouter();
  const { settings } = useSettings();
  const { initialMode } = useNewLessonModal();

  // Default to unified mode
  const [mode, setMode] = useState<ModalMode>('unified');
  // Unified mode state
  const [unifiedTopic, setUnifiedTopic] = useState('');
  const [unifiedPhraseType, setUnifiedPhraseType] = useState<PhraseType>('phrases');
  const [isCreatingUnified, setIsCreatingUnified] = useState(false);

  // Legacy lesson mode state
  const [lessonTopic, setLessonTopic] = useState('');
  const [phrases, setPhrases] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Legacy set mode state
  const [phraseSetTopic, setPhraseSetTopic] = useState('');
  const [phraseType, setPhraseType] = useState<PhraseType>('phrases');
  const [generatedPhrases, setGeneratedPhrases] = useState<GeneratedPhrase[]>([]);

  // Sync mode when modal opens
  useEffect(() => {
    if (visible) {
      // Map initialMode to new mode system - default to unified
      if (initialMode === 'lesson') {
        setMode('lesson');
      } else if (initialMode === 'set') {
        setMode('set');
      } else {
        setMode('unified');
      }
    }
  }, [visible, initialMode]);

  const handleClose = () => {
    setUnifiedTopic('');
    setUnifiedPhraseType('phrases');
    setLessonTopic('');
    setPhrases('');
    setPrompt('');
    setPhraseSetTopic('');
    setPhraseType('phrases');
    setGeneratedPhrases([]);
    setMode('unified');
    onClose();
  };

  // Unified mode handler
  const handleCreateUnifiedSubject = async () => {
    if (!unifiedTopic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    if (!geminiApiKey) {
      Alert.alert('API Key Required', 'Please set the geminiApiKey in app.config.ts');
      return;
    }

    setIsCreatingUnified(true);
    try {
      const result = await createUnifiedSubject(database, {
        topic: unifiedTopic.trim(),
        phraseType: unifiedPhraseType,
        primaryLang: settings.topicLanguage,
        secondaryLang: settings.userLanguage,
        level: settings.level,
        phraseCount: 20,
      });

      handleClose();
      // Navigate to the new subject detail screen
      router.push(`/subject/${result.subject.id}` as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to create topic. Please try again.');
      console.error(error);
    } finally {
      setIsCreatingUnified(false);
    }
  };

  // Legacy lesson mode handlers
  const handleGeneratePrompt = async () => {
    if (!lessonTopic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    if (!geminiApiKey) {
      Alert.alert('API Key Required', 'Please set the geminiApiKey in app.config.ts');
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateTutorPrompt({
        relatedPhrases: phrases
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean),
        userLanguage: settings.userLanguage,
        topicLanguage: settings.topicLanguage,
        level: settings.level,
        instructions: lessonTopic,
      });
      setPrompt(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate prompt. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePhraseSet = async () => {
    if (!phraseSetTopic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    if (!geminiApiKey) {
      Alert.alert('API Key Required', 'Please set the geminiApiKey in app.config.ts');
      return;
    }

    setIsLoading(true);
    try {
      const result = await generatePhraseSet({
        topic: phraseSetTopic,
        primaryLanguage: settings.topicLanguage,
        secondaryLanguage: settings.userLanguage,
        level: settings.level,
        count: 20,
        phraseType,
      });
      setGeneratedPhrases(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate phrases. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhrase = (index: number) => {
    setGeneratedPhrases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleChangeLength = async (length: 'shorter' | 'longer') => {
    if (!prompt) return;

    setIsLoading(true);
    try {
      const result = await changePromptLength({ promptText: prompt, length });
      setPrompt(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to modify prompt');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!prompt) return;

    setIsSaving(true);
    try {
      const lesson = await Lesson.addLesson(database, {
        topic: lessonTopic.trim(),
        phrases: phrases.trim() || null,
        prompt,
        lang: settings.topicLanguage,
        level: settings.level,
        promptLanguage: 'user',
      });
      handleClose();
      router.push(`/lesson/${lesson.id}` as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to save lesson');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePhraseSet = async () => {
    if (generatedPhrases.length === 0) return;

    setIsSaving(true);
    try {
      // Create the deck
      const deck = await Deck.createAISet(database, {
        name: phraseSetTopic.trim(),
        topic: phraseSetTopic.trim(),
        primaryLang: settings.topicLanguage,
        secondaryLang: settings.userLanguage,
        level: settings.level,
      });

      // Create phrases, translations, deck translations, and SRS cards
      for (const phrase of generatedPhrases) {
        // Create or find primary phrase (target language)
        const primaryPhrase = await Phrase.findOrCreatePhrase(database, {
          text: phrase.primary,
          lang: settings.topicLanguage,
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
          lang: settings.userLanguage,
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

      handleClose();
      router.push(`/set/${deck.id}` as any);
    } catch (error) {
      Alert.alert('Error', 'Failed to save phrase set');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderModeSelector = () => (
    <View style={[styles.modeSelector, { backgroundColor: colors.card }]}>
      <Pressable
        style={[styles.modeTab, mode === 'unified' && { backgroundColor: colors.primary }]}
        onPress={() => setMode('unified')}
      >
        <Text
          style={[
            styles.modeTabText,
            { color: mode === 'unified' ? '#fff' : colors.textSecondary },
          ]}
        >
          New Topic
        </Text>
      </Pressable>
      <Pressable
        style={[styles.modeTab, mode === 'lesson' && { backgroundColor: colors.primary }]}
        onPress={() => setMode('lesson')}
      >
        <Text
          style={[styles.modeTabText, { color: mode === 'lesson' ? '#fff' : colors.textSecondary }]}
        >
          Prompt Only
        </Text>
      </Pressable>
      <Pressable
        style={[styles.modeTab, mode === 'set' && { backgroundColor: colors.primary }]}
        onPress={() => setMode('set')}
      >
        <Text
          style={[styles.modeTabText, { color: mode === 'set' ? '#fff' : colors.textSecondary }]}
        >
          Set Only
        </Text>
      </Pressable>
    </View>
  );

  const renderUnifiedForm = () => (
    <View style={styles.formContainer}>
      <Text style={[styles.formDescription, { color: colors.textSecondary }]}>
        Create a complete learning topic with vocabulary flashcards and a writing prompt.
      </Text>

      <NewSetForm
        topic={unifiedTopic}
        onTopicChange={setUnifiedTopic}
        phraseType={unifiedPhraseType}
        onPhraseTypeChange={setUnifiedPhraseType}
        onGenerate={handleCreateUnifiedSubject}
        isLoading={isCreatingUnified}
        buttonLabel="Create Topic"
      />
    </View>
  );

  const getModalTitle = () => {
    switch (mode) {
      case 'unified':
        return 'New Learning Topic';
      case 'lesson':
        return 'New Writing Prompt';
      case 'set':
        return 'New Phrase Set';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader title={getModalTitle()} onClose={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            {renderModeSelector()}

            <LessonSettingsDisplay
              topicLanguage={settings.topicLanguage}
              level={settings.level}
              onSettingsPress={handleClose}
            />

            {mode === 'unified' && renderUnifiedForm()}

            {mode === 'lesson' && (
              <>
                <NewLessonForm
                  topic={lessonTopic}
                  onTopicChange={setLessonTopic}
                  onGenerate={handleGeneratePrompt}
                  isLoading={isLoading}
                />

                {prompt && (
                  <PromptCard
                    prompt={prompt}
                    onMakeShorter={() => handleChangeLength('shorter')}
                    onMakeLonger={() => handleChangeLength('longer')}
                    onSave={handleSaveLesson}
                    isLoading={isLoading}
                    isSaving={isSaving}
                  />
                )}
              </>
            )}

            {mode === 'set' && (
              <>
                <NewSetForm
                  topic={phraseSetTopic}
                  onTopicChange={setPhraseSetTopic}
                  phraseType={phraseType}
                  onPhraseTypeChange={setPhraseType}
                  onGenerate={handleGeneratePhraseSet}
                  isLoading={isLoading}
                />

                {generatedPhrases.length > 0 && (
                  <SetPreviewCard
                    phrases={generatedPhrases}
                    onRemovePhrase={handleRemovePhrase}
                    onSave={handleSavePhraseSet}
                    isSaving={isSaving}
                  />
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    gap: 24,
  },
  modalSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  modeSelector: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  formContainer: {
    gap: 16,
  },
  formDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
