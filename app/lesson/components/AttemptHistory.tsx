import { StyleSheet, Text, View } from 'react-native';

import { Attempt } from '@/database/models';
import { useColors } from '@/hooks';

import { AttemptCard } from './AttemptCard';

type AttemptHistoryProps = {
  attempts: Attempt[];
  expandedAttemptId: string | null;
  onToggleAttempt: (attemptId: string) => void;
  formatDate: (timestamp: number) => string;
};

export function AttemptHistory({
  attempts,
  expandedAttemptId,
  onToggleAttempt,
  formatDate,
}: AttemptHistoryProps) {
  const colors = useColors();

  if (attempts.length === 0) {
    return null;
  }

  return (
    <View style={styles.historySection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Attempt History ({attempts.length})
      </Text>
      {attempts.map((attempt) => (
        <AttemptCard
          key={attempt.id}
          attempt={attempt}
          isExpanded={expandedAttemptId === attempt.id}
          onToggle={() => onToggleAttempt(attempt.id)}
          formatDate={formatDate}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  historySection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
