import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LessonItem } from '@/types';

interface LessonItemCardProps {
  item: LessonItem;
  index: number;
  total: number;
}

const LessonItemCard: React.FC<LessonItemCardProps> = ({ item, index, total }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.progressLabel}>
          Item {index + 1} of {total}
        </Text>
      </View>
      <Text style={styles.prompt}>{item.prompt}</Text>
      {item.focusConcepts.length > 0 && (
        <View style={styles.focusSection}>
          <Text style={styles.sectionTitle}>Concept focus</Text>
          <View style={styles.chipGroup}>
            {item.focusConcepts.map((concept) => (
              <View key={concept} style={styles.chip}>
                <Text style={styles.chipText}>{concept}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {item.focusWords.length > 0 && (
        <View style={styles.focusSection}>
          <Text style={styles.sectionTitle}>Vocabulary focus</Text>
          <View style={styles.chipGroup}>
            {item.focusWords.map((word) => (
              <View key={word} style={[styles.chip, styles.wordChip]}>
                <Text style={[styles.chipText, styles.wordChipText]}>{word}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1'
  },
  prompt: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827'
  },
  focusSection: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563'
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#EEF2FF'
  },
  wordChip: {
    backgroundColor: '#DCFCE7'
  },
  chipText: {
    fontSize: 12,
    color: '#4338CA'
  },
  wordChipText: {
    color: '#166534'
  }
});

export default LessonItemCard;
