import { StyleSheet, Text } from 'react-native';

import { useColors } from '@/hooks';

type ReviewProgressProps = {
  current: number;
  total: number;
};

export function ReviewProgress({ current, total }: ReviewProgressProps) {
  const colors = useColors();

  return (
    <Text style={[styles.progress, { color: colors.textSecondary }]}>
      Card {current} of {total}
    </Text>
  );
}

const styles = StyleSheet.create({
  progress: {
    fontSize: 13,
  },
});
