import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { CorrectionFeedback } from '@/types';

interface CorrectionFeedbackCardProps {
  feedback: CorrectionFeedback;
}

const CorrectionFeedbackCard: React.FC<CorrectionFeedbackCardProps> = ({ feedback }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Your answer</Text>
      <Text style={styles.userAnswer}>{feedback.userAnswer || '—'}</Text>
      <Text style={styles.sectionLabel}>Suggested correction</Text>
      <Text style={styles.corrected}>{feedback.correctedAnswer}</Text>
      {feedback.notes ? (
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <Text style={styles.notes}>{feedback.notes}</Text>
        </View>
      ) : null}
      <View style={styles.scoreRow}>
        <ScorePill label="Spelling" value={feedback.spellingScore} color="#F97316" />
        <ScorePill label="Grammar" value={feedback.grammarScore} color="#0EA5E9" />
      </View>
    </View>
  );
};

const ScorePill: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <View style={[styles.scorePill, { backgroundColor: color }]}> 
    <Text style={styles.scoreLabel}>{label}</Text>
    <Text style={styles.scoreValue}>{value}%</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase'
  },
  userAnswer: {
    fontSize: 16,
    color: '#111827'
  },
  corrected: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  notesSection: {
    marginTop: 8,
    gap: 8
  },
  notes: {
    fontSize: 15,
    color: '#4B5563'
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12
  },
  scorePill: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center'
  },
  scoreLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    textTransform: 'uppercase'
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700'
  }
});

export default CorrectionFeedbackCard;
