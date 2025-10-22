import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '@theme/colors';

interface LessonPromptCardProps {
  prompt: string;
  focusTerms?: string[];
  focusConcepts?: string[];
  onAddTerm: (term: string) => void;
  onAddConcept: (concept: string) => void;
}

const LessonPromptCard: React.FC<LessonPromptCardProps> = ({
  prompt,
  focusTerms,
  focusConcepts,
  onAddTerm,
  onAddConcept
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.prompt}>{prompt}</Text>
      <View style={styles.focusSection}>
        {focusTerms?.map((term) => (
          <TouchableOpacity key={term} style={styles.badge} onPress={() => onAddTerm(term)}>
            <Text style={styles.badgeLabel}>{term}</Text>
            <Text style={styles.badgeHint}>Add word</Text>
          </TouchableOpacity>
        ))}
        {focusConcepts?.map((concept) => (
          <TouchableOpacity
            key={concept}
            style={[styles.badge, styles.conceptBadge]}
            onPress={() => onAddConcept(concept)}
          >
            <Text style={styles.badgeLabel}>{concept}</Text>
            <Text style={styles.badgeHint}>Add concept</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border
  },
  prompt: {
    fontSize: typography.subheader,
    color: colors.textPrimary,
    lineHeight: 24
  },
  focusSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm
  },
  badge: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  conceptBadge: {
    borderColor: colors.secondary
  },
  badgeLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600'
  },
  badgeHint: {
    color: colors.textSecondary,
    fontSize: typography.caption
  }
});

export default LessonPromptCard;
