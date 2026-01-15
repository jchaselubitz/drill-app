import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import { Lesson } from '@/database/models';
import { useColors } from '@/hooks';
import { changePromptLength, generateTutorPrompt } from '@/lib/ai/tutor';

import { LessonSettingsDisplay } from './LessonSettingsDisplay';
import { ModalHeader } from './ModalHeader';
import { NewLessonForm } from './NewLessonForm';
import { PromptCard } from './PromptCard';

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

type NewLessonModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function NewLessonModal({ visible, onClose }: NewLessonModalProps) {
  const colors = useColors();
  const router = useRouter();
  const { settings } = useSettings();

  const [topic, setTopic] = useState('');
  const [phrases, setPhrases] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setTopic('');
    setPhrases('');
    setPrompt('');
    onClose();
  };

  const handleGeneratePrompt = async () => {
    if (!topic.trim()) {
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
        instructions: topic,
      });
      setPrompt(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate prompt. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
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
        topic: topic.trim(),
        phrases: phrases.trim() || null,
        prompt,
        lang: settings.topicLanguage,
        level: settings.level,
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <ModalHeader title="New Lesson" onClose={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <LessonSettingsDisplay
              topicLanguage={settings.topicLanguage}
              level={settings.level}
              onSettingsPress={handleClose}
            />

            <NewLessonForm
              topic={topic}
              onTopicChange={setTopic}
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
});
