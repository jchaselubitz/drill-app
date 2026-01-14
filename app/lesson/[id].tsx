import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import Constants from 'expo-constants';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { useSettings } from '@/contexts/SettingsContext';
import database from '@/database';
import { Attempt, Lesson } from '@/database/models';
import { ATTEMPT_TABLE, LESSON_TABLE } from '@/database/schema';
import { useColors } from '@/hooks';
import { reviewParagraph } from '@/lib/ai/tutor';

import { AttemptForm, AttemptHistory, PromptCard } from './components';

const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const { settings } = useSettings();
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

  const handleDeleteLesson = () => {
    if (!lesson) return;

    Alert.alert(
      'Delete Lesson',
      `Are you sure you want to delete "${lesson.topic}"? This action cannot be undone.`,
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
                await lesson.destroyPermanently();
              });
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete lesson. Please try again.');
              console.error(error);
            }
          },
        },
      ]
    );
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
          headerBackTitle: 'Lessons',
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
          <PromptCard lesson={lesson} />

          <AttemptForm
            paragraph={paragraph}
            onChangeText={setParagraph}
            onSubmit={handleSubmitAttempt}
            isLoading={isLoading}
          />

          <AttemptHistory
            attempts={attempts}
            expandedAttemptId={expandedAttemptId}
            onToggleAttempt={toggleAttemptExpand}
            formatDate={formatDate}
          />

          <View style={styles.deleteSection}>
            <Button
              title="Delete Lesson"
              onPress={handleDeleteLesson}
              variant="destructive"
              disabled={isLoading}
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
  deleteSection: {
    marginTop: 8,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
});
