import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme/colors';

interface ScoreSummaryProps {
  recentScores: { spelling: number; grammar: number }[];
}

const average = (values: number[]) =>
  values.length === 0 ? 0 : values.reduce((sum, item) => sum + item, 0) / values.length;

const ScoreSummary: React.FC<ScoreSummaryProps> = ({ recentScores }) => {
  const lastScore = recentScores[0];
  const averageSpelling = average(recentScores.map((score) => score.spelling));
  const averageGrammar = average(recentScores.map((score) => score.grammar));

  return (
    <View style={styles.container}>
      <View style={styles.column}>
        <Text style={styles.label}>Last spelling</Text>
        <Text style={styles.score}>{lastScore ? lastScore.spelling : '—'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>Last grammar</Text>
        <Text style={styles.score}>{lastScore ? lastScore.grammar : '—'}</Text>
      </View>
      <View style={styles.column}>
        <Text style={styles.label}>10-response avg</Text>
        <Text style={styles.average}>{`${averageSpelling.toFixed(0)} / ${averageGrammar.toFixed(0)}`}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  column: {
    alignItems: 'center'
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption
  },
  score: {
    color: colors.textPrimary,
    fontSize: typography.header,
    fontWeight: '600'
  },
  average: {
    color: colors.primary,
    fontSize: typography.subheader,
    fontWeight: '600'
  }
});

export default ScoreSummary;
