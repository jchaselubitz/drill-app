import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LessonRequestForm from '@/components/LessonRequestForm';
import ScoreSummary from '@/components/ScoreSummary';
import { useLesson } from '@/state/LessonProvider';
import { useMockLessonPlanner } from '@/hooks/useMockLessonPlanner';
import type { ProficiencyLevel } from '@/types';
import type { RootStackParamList } from '@/navigation/RootNavigator';

const DEFAULT_FORM = {
  targetLanguage: '',
  proficiency: 'B1' as ProficiencyLevel,
  topic: '',
  nativeLanguage: ''
};

const LessonRequestScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSubmitting, setSubmitting] = useState(false);
  const { metrics, setRequest, enqueueItems, reset } = useLesson();
  const { createMockLesson } = useMockLessonPlanner();

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const lesson = createMockLesson({
        targetLanguage: form.targetLanguage,
        nativeLanguage: form.nativeLanguage,
        proficiency: form.proficiency,
        topic: form.topic
      });
      reset();
      setRequest(lesson.request);
      enqueueItems(lesson.items);
      navigation.navigate('Lesson');
    } catch (error) {
      Alert.alert('Unable to start lesson', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.hero}>
        <Text style={styles.heading}>Create a lesson</Text>
        <Text style={styles.subheading}>
          Choose your language, level, and focus topic. We will generate ten practice prompts and
          keep the lesson going as you learn.
        </Text>
      </View>
      <LessonRequestForm value={form} onChange={setForm} onSubmit={handleSubmit} isLoading={isSubmitting} />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent performance</Text>
        <ScoreSummary metrics={metrics} />
      </View>
      <View style={{ height: 48 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6'
  },
  hero: {
    padding: 16,
    gap: 12
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827'
  },
  subheading: {
    fontSize: 16,
    color: '#4B5563'
  },
  section: {
    paddingHorizontal: 16,
    gap: 16
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827'
  }
});

export default LessonRequestScreen;
