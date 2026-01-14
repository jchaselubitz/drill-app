import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Markdown } from '@/components';
import { Attempt } from '@/database/models';
import { useColors } from '@/hooks';

type AttemptCardProps = {
  attempt: Attempt;
  isExpanded: boolean;
  onToggle: () => void;
  formatDate: (timestamp: number) => string;
};

export function AttemptCard({ attempt, isExpanded, onToggle, formatDate }: AttemptCardProps) {
  const colors = useColors();

  return (
    <Pressable onPress={onToggle}>
      <Card style={styles.attemptCard}>
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
                <Text style={[styles.detailLabel, { color: colors.success }]}>
                  Corrected Version
                </Text>
              </View>
              <Markdown style={styles.detailText}>{attempt.correction}</Markdown>
            </View>

            <View style={styles.detailSection}>
              <View style={styles.detailHeader}>
                <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
                <Text style={[styles.detailLabel, { color: colors.primary }]}>Feedback</Text>
              </View>
              <Markdown style={styles.detailText}>{attempt.feedback}</Markdown>
            </View>
          </View>
        )}
      </Card>
    </Pressable>
  );
}

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
    fontSize: 14,
    fontWeight: '600',
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
