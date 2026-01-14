import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { useColors } from '@/hooks';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
  loading?: boolean;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const colors = useColors();

  const backgroundColor =
    variant === 'primary' ? colors.primary : variant === 'destructive' ? colors.error : colors.card;
  const textColor =
    variant === 'primary'
      ? colors.primaryText
      : variant === 'destructive'
        ? colors.primaryText
        : colors.text;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: pressed || disabled ? 0.7 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
