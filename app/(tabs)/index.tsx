import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, TextInput } from '@/components';
import { useColors, useSettings } from '@/hooks';
import { generateTutorPrompt, changePromptLength } from '@/lib/ai/tutor';

export default function PracticeScreen() {
  const colors = useColors();
  const { settings } = useSettings();

  const [topic, setTopic] = useState('');
  const [phrases, setPhrases] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGeneratePrompt = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic');
      return;
    }

    if (!settings.apiKey) {
      Alert.alert('API Key Required', 'Please add your Gemini API key in Settings');
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateTutorPrompt({
        relatedPhrases: phrases.split(',').map((p) => p.trim()).filter(Boolean),
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
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
              title="Generate Prompt"
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
              <Text style={[styles.promptText, { color: colors.text }]}>
                {prompt}
              </Text>
              <View style={styles.promptActions}>
                <Button
                  title="Shorter"
                  variant="secondary"
                  onPress={() => handleChangeLength('shorter')}
                  disabled={isLoading}
                />
                <Button
                  title="Longer"
                  variant="secondary"
                  onPress={() => handleChangeLength('longer')}
                  disabled={isLoading}
                />
              </View>
            </Card>
          )}
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
  content: {
    padding: 20,
    gap: 24,
  },
  subtitle: {
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
