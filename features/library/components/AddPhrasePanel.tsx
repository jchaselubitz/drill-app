import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { LanguageChooser } from '@/components/LanguageChooser';
import { TextInput } from '@/components/TextInput';
import { Phrase } from '@/database/models';
import { ModalHeader } from '@/features/lessons/components/ModalHeader';
import { useColors } from '@/hooks';
import { detectLanguage } from '@/lib/ai/translate';
import type { LanguageCode } from '@/types';

const AUTO_DETECT = 'auto' as const;

type AddPhraseModalProps = {
  visible: boolean;
  onClose: () => void;
  onPhraseAdded?: () => void;
};

export function AddPhraseModal({ visible, onClose, onPhraseAdded }: AddPhraseModalProps) {
  const colors = useColors();
  const db = useDatabase();
  const [text, setText] = useState('');
  const [lang, setLang] = useState<LanguageCode | typeof AUTO_DETECT>(AUTO_DETECT);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setText('');
    setLang(AUTO_DETECT);
    onClose();
  };

  const handleSave = async () => {
    if (!text.trim()) return;

    setIsSaving(true);
    try {
      const detectedLang = lang === AUTO_DETECT ? await detectLanguage(text.trim()) : lang;

      await Phrase.addPhrase(db, {
        text: text.trim(),
        lang: detectedLang as LanguageCode,
        source: 'manual',
        partSpeech: null,
        favorite: false,
        filename: null,
        type: text.trim().includes(' ') ? 'phrase' : 'word',
        note: null,
        difficulty: null,
        historyId: null,
        attemptId: null,
      });

      setText('');
      setLang(AUTO_DETECT);
      onClose();
      onPhraseAdded?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add phrase.';
      Alert.alert('Error', message);
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
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ModalHeader title="Add Phrase" onClose={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.form}>
              <TextInput
                placeholder="Enter a word or phrase..."
                value={text}
                onChangeText={setText}
                autoFocus
              />
              <View style={styles.languageChooserContainer}>
                <LanguageChooser
                  label="Language"
                  value={lang}
                  onValueChange={setLang}
                  includeAutoDetect
                  autoDetectValue={AUTO_DETECT}
                />
              </View>
              <Button
                text="Save"
                onPress={handleSave}
                buttonState={isSaving ? 'loading' : !text.trim() ? 'disabled' : 'default'}
                loadingText="Saving..."
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  form: {
    gap: 16,
  },
  languageChooserContainer: {
    gap: 8,
  },
});
