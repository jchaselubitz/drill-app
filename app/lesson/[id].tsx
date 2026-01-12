import { Button, Card, Markdown, TextInput } from '@/components';
import database from '@/database';
import { Attempt, Lesson } from '@/database/models';
import { ATTEMPT_TABLE, LESSON_TABLE } from '@/database/schema';
import { useColors, useSettings } from '@/hooks';
import { reviewParagraph } from '@/lib/ai/review';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { settings } = useSettings();
  const router = useRouter();
  const db = useDatabase();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [paragraph, setParagraph] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Subscribe to lesson
    const lessonSub = db.collections
      .get<Lesson>(LESSON_TABLE)
      .findAndObserve(id)
      .subscribe((result) => {
        setLesson(result);
      });

    // Subscribe to attempts for this lesson
    const attemptsSub = db.collections
      .get<Attempt>(ATTEMPT_TABLE)
      .query(Q.where('lesson_id', id), Q.sortBy('created_at', Q.desc))
      .observe()
      .subscribe((results) => {
        setAttempts(results);
      });

    return () => {
      lessonSub.unsubscribe();
      attemptsSub.unsubscribe();
    };
  }, [id, db]);

  const handleSubmitAttempt = async () => {
    if (!paragraph.trim() || !lesson) {
      Alert.alert('Error', 'Please write something to submit');
      return;
    }

    if (!geminiApiKey) {
      Alert.alert('API Key Required', 'Please set the geminiApiKey in app.config.ts');
      return;
    }

    setIsLoading(true);
    try {
      const result = await reviewParagraph({
        paragraph,
        topicLanguage: settings.topicLanguage,
        userLanguage: settings.userLanguage,
      });

      await Attempt.addAttempt(database, {
        lessonId: lesson.id,
        paragraph: paragraph.trim(),
        correction: result.correction,
        feedback: result.feedback,
      });

      setParagraph('');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit attempt. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const toggleAttemptExpand = (attemptId: string) => {
    setExpandedAttemptId(expandedAttemptId === attemptId ? null : attemptId);
  };

  if (!lesson) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Loading lesson...</Text>
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
          title: lesson.topic,
          headerShown: true,
          headerBackTitle: 'Library',
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
          {/* Prompt Card */}
          <Card style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <Ionicons name="bulb" size={20} color={colors.primary} />
              <Text style={[styles.promptLabel, { color: colors.textSecondary }]}>
                Writing Prompt
              </Text>
            </View>
            <Text style={[styles.promptText, { color: colors.text }]}>{lesson.prompt}</Text>
            <View style={styles.lessonMeta}>
              <View style={[styles.levelBadge, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.levelText, { color: colors.primary }]}>{lesson.level}</Text>
              </View>
              {lesson.phrases && (
                <Text style={[styles.phrasesText, { color: colors.textSecondary }]}>
                  Phrases: {lesson.phrases}
                </Text>
              )}
            </View>
          </Card>

          {/* New Attempt Form */}
          <View style={styles.attemptForm}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Response</Text>
            <TextInput
              placeholder="Write your paragraph here..."
              value={paragraph}
              onChangeText={setParagraph}
              multiline
              numberOfLines={6}
              style={styles.textArea}
              textAlignVertical="top"
            />
            <Button
              title="Submit Attempt"
              onPress={handleSubmitAttempt}
              loading={isLoading}
              disabled={!paragraph.trim()}
            />
          </View>

          {/* Attempt History */}
          {attempts.length > 0 && (
            <View style={styles.historySection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Attempt History ({attempts.length})
              </Text>
              {attempts.map((attempt) => {
                const isExpanded = expandedAttemptId === attempt.id;
                return (
                  <Pressable key={attempt.id} onPress={() => toggleAttemptExpand(attempt.id)}>
                    <Card style={styles.attemptCard}>
                      <View style={styles.attemptHeader}>
                        <View style={styles.attemptMeta}>
                          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                          <Text style={[styles.attemptDate, { color: colors.textSecondary }]}>
                            {formatDate(attempt.createdAt)}
                          </Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={colors.textSecondary}
                        />
                      </View>
                      <Text
                        style={[styles.attemptPreview, { color: colors.text }]}
                        numberOfLines={isExpanded ? undefined : 2}
                      >
                        {attempt.paragraph}
                      </Text>

                      {isExpanded && (
                        <View style={styles.attemptDetails}>
                          <View style={[styles.divider, { backgroundColor: colors.border }]} />

                          <View style={styles.detailSection}>
                            <View style={styles.detailHeader}>
                              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                              <Text style={[styles.detailLabel, { color: colors.success }]}>
                                Corrected Version
                              </Text>
                            </View>
                            <Markdown style={styles.detailText}>{attempt.correction}</Markdown>
                          </View>

                          <View style={styles.detailSection}>
                            <View style={styles.detailHeader}>
                              <Ionicons
                                name="chatbubble-ellipses"
                                size={16}
                                color={colors.primary}
                              />
                              <Text style={[styles.detailLabel, { color: colors.primary }]}>
                                Feedback
                              </Text>
                            </View>
                            <Markdown style={styles.detailText}>{attempt.feedback}</Markdown>
                          </View>
                        </View>
                      )}
                    </Card>
                  </Pressable>
                );
              })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    gap: 24,
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
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  phrasesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  attemptForm: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 120,
  },
  historySection: {
    gap: 12,
  },
  attemptCard: {
    gap: 8,
    marginBottom: 8,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attemptDate: {
    fontSize: 12,
  },
  attemptPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  attemptDetails: {
    gap: 12,
    marginTop: 8,
  },
  divider: {
    height: 1,
  },
  detailSection: {
    gap: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
