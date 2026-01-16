import { StyleSheet, View } from 'react-native';

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
};

export function RatingButtons({ onRate }: RatingButtonsProps) {
  return (
    <View style={styles.ratingRow}>
      {ratingButtons.map((button) => (
        <View key={button.rating} style={styles.ratingButton}>
          <ReviewButton
            text={button.label}
            onPress={() => onRate(button.rating)}
            variant={button.variant}
            tintColor={button.tintColor}
          />
        </View>
      ))}
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
});
