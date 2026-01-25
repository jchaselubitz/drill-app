import { StyleSheet, Text, View } from 'react-native';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { Phrase, SrsCard, Translation } from '@/database/models';
import { useColors } from '@/hooks';

interface SpacedRepetitionStatsProps {
  srsCards: SrsCard[];
  linkedTranslations: { translation: Translation; phrase: Phrase }[];
  phrase: Phrase;
}

export function SpacedRepetitionStats({
  srsCards,
  linkedTranslations,
  phrase,
}: SpacedRepetitionStatsProps) {
  const colors = useColors();

  if (srsCards.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title="Spaced Repetition Stats"
      icon="stats-chart-outline"
      defaultExpanded={false}
      preview={`${srsCards.length} review card${srsCards.length > 1 ? 's' : ''}`}
    >
      <View style={styles.statsContainer}>
        {srsCards.map((card) => {
          const translation = linkedTranslations.find(
            (item) => item.translation.id === card.translationId
          );
          if (!translation) return null;

          const directionLabel =
            card.direction === 'primary_to_secondary'
              ? `${phrase.text} → ${translation.phrase.text}`
              : `${translation.phrase.text} → ${phrase.text}`;

          const isOverdue = card.dueAt < Date.now() && card.state !== 'new';
          const daysUntilDue = Math.ceil((card.dueAt - Date.now()) / (1000 * 60 * 60 * 24));

          return (
            <View
              key={card.id}
              style={[
                styles.statCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.statDirection, { color: colors.text }]}>{directionLabel}</Text>

              <View style={styles.statGrid}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>State</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {card.state.charAt(0).toUpperCase() + card.state.slice(1)}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Interval</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {card.intervalDays} day{card.intervalDays !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ease</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {(card.ease * 100).toFixed(0)}%
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Reviews</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{card.reps}</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Lapses</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>{card.lapses}</Text>
                </View>

                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Next Review
                  </Text>
                  <Text style={[styles.statValue, { color: isOverdue ? '#ef4444' : colors.text }]}>
                    {card.state === 'new'
                      ? 'Not started'
                      : isOverdue
                        ? 'Overdue'
                        : daysUntilDue === 0
                          ? 'Today'
                          : daysUntilDue === 1
                            ? 'Tomorrow'
                            : `In ${daysUntilDue} days`}
                  </Text>
                </View>
              </View>

              {card.lastReviewedAt && (
                <Text style={[styles.lastReviewed, { color: colors.textSecondary }]}>
                  Last reviewed: {new Date(card.lastReviewedAt).toLocaleDateString()}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </CollapsibleSection>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    gap: 12,
  },
  statCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  statDirection: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    minWidth: '30%',
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  lastReviewed: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
});
