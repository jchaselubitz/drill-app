import { Ionicons } from '@expo/vector-icons';
import { withObservables } from '@nozbe/watermelondb/react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Markdown } from '@/components';
import { Attempt } from '@/database/models';
import type Feedback from '@/database/models/Feedback';
import { useColors } from '@/hooks';
import { formatDate } from '@/lib/helpers/helpersFormatting';

type AttemptCardProps = {
  attempt: Attempt;
  isExpanded: boolean;
  onToggle: () => void;
};

type AttemptCardInnerProps = AttemptCardProps & {
  feedbackItems: Feedback[];
};

function AttemptCardInner({ attempt, feedbackItems, isExpanded, onToggle }: AttemptCardInnerProps) {
  const colors = useColors();
  console.log(attempt);
  return (
    <Card style={styles.attemptCard}>
      <Pressable onPress={onToggle}>
        <View style={styles.attemptHeader}>
          <View style={styles.attemptMeta}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.attemptDate, { color: colors.textSecondary }]}>
              {formatDate(attempt.createdAt)}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>
      <Text
        style={[styles.attemptPreview, { color: colors.text }]}
        numberOfLines={isExpanded ? undefined : 2}
      >
        {attempt.paragraph}
      </Text>

      {isExpanded && (
        <View style={styles.attemptDetails}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <Text style={[styles.detailLabel, { color: colors.success }]}>Corrected Version</Text>
            </View>
            <Markdown style={styles.detailText}>{attempt.correction}</Markdown>
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailHeader}>
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
              <Text style={[styles.detailLabel, { color: colors.primary }]}>Feedback</Text>
            </View>
            <View style={styles.feedbackList}>
              {feedbackItems.map((item, index) => (
                <View key={index} style={styles.feedbackItem}>
                  <Text
                    style={[
                      styles.feedbackPoint,
                      { color: item.negative ? colors.error : colors.success },
                    ]}
                  >
                    {item.point}
                  </Text>
                  <Markdown style={styles.detailText}>{item.explanation as string}</Markdown>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </Card>
  );
}

export const AttemptCard = withObservables(['attempt'], ({ attempt }: AttemptCardProps) => ({
  attempt: attempt.observe(),
  feedbackItems: attempt.feedbackItems.observe(),
}))(AttemptCardInner);

const styles = StyleSheet.create({
  attemptCard: {
    gap: 8,
    marginBottom: 8,
  },
  attemptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  attemptMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attemptDate: {
    fontSize: 12,
  },
  attemptPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  attemptDetails: {
    gap: 12,
    marginTop: 8,
  },
  divider: {
    height: 1,
  },
  detailSection: {
    gap: 6,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
  },
  feedbackList: {
    marginTop: 12,
    gap: 8,
  },
  feedbackItem: {
    gap: 4,
  },
  feedbackPoint: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
