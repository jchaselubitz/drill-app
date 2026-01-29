import { StyleSheet, ViewStyle } from 'react-native';

import { useColors } from '@/hooks';

import { GlassCompatibleView } from './GlassCompatibleView';

type CardProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  disableGlass?: boolean;
};

export function Card({ children, style, disableGlass = true }: CardProps) {
  const colors = useColors();

  return (
    <GlassCompatibleView
      glassEffectStyle="clear"
      isInteractive
      fallbackStyle={{ borderColor: colors.border, borderWidth: 1 }}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      disableGlass={disableGlass}
    >
      {children}
    </GlassCompatibleView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
