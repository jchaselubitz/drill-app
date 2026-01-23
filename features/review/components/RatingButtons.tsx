import { StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';
import type { SrsRating } from '@/types';

import { ReviewButton } from './ReviewButton';

type RatingButtonConfig = {
  rating: SrsRating;
  label: string;
  variant: 'secondary' | 'primary';
  tintColor: string;
};

const ratingButtons: RatingButtonConfig[] = [
  { rating: 'failed', label: 'Failed', variant: 'secondary', tintColor: 'rgba(255, 59, 48, 0.8)' }, // red
  { rating: 'hard', label: 'Hard', variant: 'secondary', tintColor: 'rgba(255, 149, 0, 0.8)' }, // orange
  { rating: 'good', label: 'Good', variant: 'primary', tintColor: 'rgba(52, 199, 89, 0.8)' }, // green
  { rating: 'easy', label: 'Easy', variant: 'secondary', tintColor: 'rgba(0, 122, 255, 0.8)' }, // blue
];

type RatingButtonsProps = {
  onRate: (rating: SrsRating) => void;
  intervals?: Record<SrsRating, string>;
};

export function RatingButtons({ onRate, intervals }: RatingButtonsProps) {
  const colors = useColors();

  return (
    <View style={styles.ratingRow}>
      {ratingButtons.map((button) => {
        const intervalText = intervals?.[button.rating];
        const textColor = button.variant === 'primary' ? colors.primaryText : colors.text;
        const buttonContent = (
          <View style={styles.buttonContent}>
            <Text style={[styles.buttonLabel, { color: textColor }]}>{button.label}</Text>
            {intervalText && (
              <Text style={[styles.intervalText, { color: textColor }]}>{intervalText}</Text>
            )}
          </View>
        );
        return (
          <View key={button.rating} style={styles.ratingButton}>
            <ReviewButton
              text={buttonContent}
              onPress={() => onRate(button.rating)}
              variant={button.variant}
              tintColor={button.tintColor}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ratingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ratingButton: {
    flex: 1,
  },
  buttonContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  intervalText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
    opacity: 0.8,
  },
});
