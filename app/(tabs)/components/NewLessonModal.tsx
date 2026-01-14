import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { Button, Card, TextInput } from '@/components';
import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import { Lesson } from '@/database/models';
import { useColors } from '@/hooks';
import { changePromptLength, generateTutorPrompt } from '@/lib/ai/tutor';

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
        <View style={styles.dragHandleContainer}>
          <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary }]} />
        </View>

        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={[styles.closeButtonText, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.modalTitle, { color: colors.text }]}>New Lesson</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Get a writing prompt tailored to your level
            </Text>

            <View style={styles.form}>
              <TextInput
                label="What should I write about?"
                placeholder="e.g., my favorite vacation, a day at work..."
                value={topic}
                onChangeText={setTopic}
              />

              <TextInput
                label="Related phrases (optional)"
                placeholder="Comma-separated phrases to practice"
                value={phrases}
                onChangeText={setPhrases}
              />

              <Button
                title="Generate Lesson"
                onPress={handleGeneratePrompt}
                loading={isLoading}
                disabled={!topic.trim()}
              />
            </View>

            {prompt && (
              <Card style={styles.promptCard}>
                <View style={styles.promptHeader}>
                  <Ionicons name="bulb" size={20} color={colors.primary} />
                  <Text style={[styles.promptLabel, { color: colors.textSecondary }]}>
                    Your Writing Prompt
                  </Text>
                </View>
                <Text style={[styles.promptText, { color: colors.text }]}>{prompt}</Text>
                <View style={styles.promptActions}>
                  <Button
                    title="Shorter"
                    variant="secondary"
                    onPress={() => handleChangeLength('shorter')}
                    disabled={isLoading || isSaving}
                  />
                  <Button
                    title="Longer"
                    variant="secondary"
                    onPress={() => handleChangeLength('longer')}
                    disabled={isLoading || isSaving}
                  />
                </View>
                <Button
                  title="Save Lesson"
                  onPress={handleSaveLesson}
                  loading={isSaving}
                  disabled={isLoading}
                />
              </Card>
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
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    minWidth: 60,
  },
  closeButtonText: {
    fontSize: 17,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    minWidth: 60,
  },
  modalContent: {
    padding: 20,
    gap: 24,
  },
  modalSubtitle: {
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  promptCard: {
    gap: 12,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  promptText: {
    fontSize: 17,
    lineHeight: 26,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
