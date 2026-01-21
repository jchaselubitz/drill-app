import { StyleSheet, Text } from 'react-native';

import { useColors } from '@/hooks';

type ReviewProgressProps = {
  newRemaining: number;
  reviewsRemaining: number;
  completedToday: number;
};

export function ReviewProgress({
  newRemaining,
  reviewsRemaining,
  completedToday,
}: ReviewProgressProps) {
  const colors = useColors();

  return (
    <Text style={[styles.progress, { color: colors.textSecondary }]}>
      New: {newRemaining} • Reviews: {reviewsRemaining} • Completed: {completedToday}
    </Text>
  );
}

const styles = StyleSheet.create({
  progress: {
    fontSize: 13,
  },
});
