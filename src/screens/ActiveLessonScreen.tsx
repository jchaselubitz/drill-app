import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import LessonItemCard from '@/components/LessonItemCard';
import CorrectionFeedbackCard from '@/components/CorrectionFeedbackCard';
import { useLesson } from '@/state/LessonProvider';
import { useMockLessonPlanner } from '@/hooks/useMockLessonPlanner';
import type { CorrectionFeedback } from '@/types';

const ActiveLessonScreen: React.FC = () => {
  const { queue, currentIndex, advance, request } = useLesson();
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<CorrectionFeedback | null>(null);
  const { evaluateMockAnswer, getContinuationItems } = useMockLessonPlanner();

  const currentItem = queue[currentIndex];
  const hasMoreItems = useMemo(() => currentIndex < queue.length - 1, [currentIndex, queue.length]);

  const handleSubmit = () => {
    if (!currentItem) {
      return;
    }
    const evaluation = evaluateMockAnswer(currentItem, answer);
    setFeedback(evaluation.feedback);
    advance(evaluation.feedback);
    setAnswer('');
    if (!hasMoreItems && request) {
      const continuation = getContinuationItems(request, queue.length);
      evaluation.enqueue?.(continuation);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: 24, padding: 16 }}>
      {currentItem ? (
        <>
          <LessonItemCard item={currentItem} index={currentIndex} total={queue.length} />
          <View style={styles.answerCard}>
            <Text style={styles.answerLabel}>Your translation</Text>
            <TextInput
              value={answer}
              onChangeText={setAnswer}
              placeholder="Type your response"
              style={styles.answerInput}
              multiline
              numberOfLines={4}
            />
            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitText}>Check answer</Text>
            </Pressable>
          </View>
          {feedback ? <CorrectionFeedbackCard feedback={feedback} /> : null}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyHeading}>No active lesson</Text>
          <Text style={styles.emptyText}>Create a lesson from the Lessons tab to begin practicing.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  answerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  answerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  answerInput: {
    minHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top'
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center'
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 48
  },
  emptyHeading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827'
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center'
  }
});

export default ActiveLessonScreen;
