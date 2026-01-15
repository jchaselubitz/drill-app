import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';
import type { SkillCategory, SkillRank, SkillStatus } from '@/types';

type SkillItemProps = {
  name: string;
  category: SkillCategory;
  rank: SkillRank;
  description: string;
  occurrenceCount: number;
  status: SkillStatus;
};

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  grammar: 'Grammar',
  spelling: 'Spelling',
  vocabulary: 'Vocabulary',
  style: 'Style',
  punctuation: 'Punctuation',
  sentence_structure: 'Structure',
  tone: 'Tone',
  idioms: 'Idioms',
};

export function SkillItem({
  name,
  category,
  rank,
  description,
  occurrenceCount,
  status,
}: SkillItemProps) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const rankColor = rank === 3 ? colors.error : rank === 2 ? '#F59E0B' : colors.success;
  const statusOpacity = status === 'resolved' ? 0.5 : status === 'improving' ? 0.7 : 1;

  return (
    <Pressable
      style={[styles.container, { borderColor: colors.border, opacity: statusOpacity }]}
      onPress={() => setExpanded(!expanded)}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.rankBadge, { backgroundColor: rankColor }]}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
          <Text
            style={[styles.name, { color: colors.text }]}
            numberOfLines={expanded ? undefined : 1}
          >
            {name}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textSecondary}
        />
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.categoryBadge, { backgroundColor: colors.border }]}>
          <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
            {CATEGORY_LABELS[category]}
          </Text>
        </View>
        {occurrenceCount > 1 && (
          <Text style={[styles.occurrenceText, { color: colors.textSecondary }]}>
            {occurrenceCount}x
          </Text>
        )}
        {status !== 'active' && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: status === 'improving' ? '#F59E0B' : colors.success },
            ]}
          >
            <Text style={styles.statusText}>
              {status === 'improving' ? 'Improving' : 'Resolved'}
            </Text>
          </View>
        )}
      </View>

      {expanded && (
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  name: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginLeft: 28,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  occurrenceText: {
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginLeft: 28,
  },
});
