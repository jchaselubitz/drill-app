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
import { reviewParagraph } from '@/lib/ai/review';
import type { ReviewResponse } from '@/types';

export default function ReviewScreen() {
  const colors = useColors();
  const { settings } = useSettings();

  const [paragraph, setParagraph] = useState('');
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!paragraph.trim()) {
      Alert.alert('Error', 'Please write something to review');
      return;
    }

    if (!settings.apiKey) {
      Alert.alert('API Key Required', 'Please add your Gemini API key in Settings');
      return;
    }

    setIsLoading(true);
    try {
      const result = await reviewParagraph({
        paragraph,
        topicLanguage: settings.topicLanguage,
        userLanguage: settings.userLanguage,
      });
      setReview(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to review paragraph. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setParagraph('');
    setReview(null);
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
            Submit your writing for AI-powered feedback
          </Text>

          <View style={styles.form}>
            <TextInput
              label="Your paragraph"
              placeholder="Write your paragraph here..."
              value={paragraph}
              onChangeText={setParagraph}
              multiline
              numberOfLines={6}
              style={styles.textArea}
              textAlignVertical="top"
            />

            <View style={styles.buttonRow}>
              <Button
                title="Clear"
                variant="secondary"
                onPress={handleClear}
                disabled={isLoading}
              />
              <View style={styles.flex}>
                <Button
                  title="Get Feedback"
                  onPress={handleSubmit}
                  loading={isLoading}
                  disabled={!paragraph.trim()}
                />
              </View>
            </View>
          </View>

          {review && (
            <View style={styles.results}>
              <Card style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <Text style={[styles.resultLabel, { color: colors.text }]}>
                    Corrected Version
                  </Text>
                </View>
                <Text style={[styles.resultText, { color: colors.text }]}>
                  {review.correction}
                </Text>
              </Card>

              <Card style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />
                  <Text style={[styles.resultLabel, { color: colors.text }]}>
                    Feedback
                  </Text>
                </View>
                <Text style={[styles.resultText, { color: colors.text }]}>
                  {review.feedback}
                </Text>
              </Card>
            </View>
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
  textArea: {
    minHeight: 150,
    paddingTop: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  results: {
    gap: 16,
  },
  resultCard: {
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultText: {
    fontSize: 15,
    lineHeight: 24,
  },
});
