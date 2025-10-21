import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LessonProgressMetrics } from '@/types';

interface ScoreSummaryProps {
  metrics: LessonProgressMetrics;
}

const ScoreSummary: React.FC<ScoreSummaryProps> = ({ metrics }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Performance</Text>
    <View style={styles.scoreGrid}>
      <ScoreBlock label="Current spelling" value={metrics.spellingScore} />
      <ScoreBlock label="Current grammar" value={metrics.grammarScore} />
      <ScoreBlock label="Avg spelling" value={metrics.averageSpellingScore} />
      <ScoreBlock label="Avg grammar" value={metrics.averageGrammarScore} />
    </View>
  </View>
);

const ScoreBlock: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.block}>
    <Text style={styles.blockLabel}>{label}</Text>
    <Text style={styles.blockValue}>{Math.round(value)}%</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 20,
    gap: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  block: {
    flexBasis: '48%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16
  },
  blockLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase'
  },
  blockValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8
  }
});

export default ScoreSummary;
