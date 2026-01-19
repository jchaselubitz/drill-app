import { Ionicons } from '@expo/vector-icons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';

import { useColors } from '@/hooks';

type KeyboardToolbarProps = {
  children?: React.ReactNode;
};

export function KeyboardToolbar({ children }: KeyboardToolbarProps) {
  const colors = useColors();
  const useGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const Container = useGlass ? GlassView : View;
  const handleDismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Container
      style={[
        styles.toolbar,
        !useGlass && { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      {...(useGlass && { glassEffectStyle: 'regular' })}
    >
      {children}
      <Pressable
        onPress={handleDismissKeyboard}
        style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}
        accessibilityLabel="Dismiss keyboard"
        accessibilityRole="button"
      >
        <Ionicons name="chevron-down" size={22} color={colors.text} />
      </Pressable>
    </Container>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderRadius: 20,
    gap: 4,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
