import { StyleSheet, Text } from 'react-native';

import { useColors } from '@/hooks';

type ReviewProgressProps = {
  totalInSession: number;
  remainingToday: number;
  completedThisSession: number;
};

export function ReviewProgress({
  totalInSession,
  remainingToday,
  completedThisSession,
}: ReviewProgressProps) {
  const colors = useColors();

  return (
    <Text style={[styles.progress, { color: colors.textSecondary }]}>
      Session: {totalInSession} cards • Remaining: {remainingToday} • Done: {completedThisSession}
    </Text>
  );
}

const styles = StyleSheet.create({
  progress: {
    fontSize: 13,
  },
});
