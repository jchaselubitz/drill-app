import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '@theme/colors';

interface CorrectionCardProps {
  original: string;
  corrected: string;
  differenceHint?: string;
}

const CorrectionCard: React.FC<CorrectionCardProps> = ({ original, corrected, differenceHint }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Suggested correction</Text>
      <View style={styles.row}>
        <Text style={styles.caption}>Original</Text>
        <Text style={styles.original}>{original}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.caption}>Correction</Text>
        <Text style={styles.corrected}>{corrected}</Text>
      </View>
      {differenceHint ? <Text style={styles.hint}>{differenceHint}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.caption
  },
  row: {
    gap: spacing.xs
  },
  caption: {
    color: colors.textSecondary,
    fontSize: typography.caption
  },
  original: {
    color: colors.textPrimary,
    fontSize: typography.body
  },
  corrected: {
    color: colors.success,
    fontSize: typography.body,
    fontWeight: '600'
  },
  hint: {
    color: colors.accent,
    fontSize: typography.caption
  }
});

export default CorrectionCard;
