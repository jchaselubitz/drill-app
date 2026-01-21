import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';

import { Phrase } from '@/database/models';
import { useColors } from '@/hooks';

type FavoriteButtonProps = {
  phrase: Phrase;
  size?: number;
  hitSlop?: number;
};

export function FavoriteButton({ phrase, size = 22, hitSlop = 8 }: FavoriteButtonProps) {
  const colors = useColors();

  const handlePress = async () => {
    await phrase.updateFavorite(!phrase.favorite);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={hitSlop}>
      <Ionicons
        name={phrase.favorite ? 'heart' : 'heart-outline'}
        size={size}
        color={phrase.favorite ? colors.error : colors.textSecondary}
      />
    </Pressable>
  );
}
