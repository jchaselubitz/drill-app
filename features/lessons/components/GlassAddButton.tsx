import { Ionicons } from '@expo/vector-icons';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { useNewLessonModal } from '@/features/lessons/context/NewLessonModalContext';
import { useColors } from '@/hooks';

export function GlassAddButton() {
  const { open } = useNewLessonModal();
  const colors = useColors();
  const useGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();
  const ButtonContainer = useGlass ? GlassView : View;

  return (
    <Pressable onPress={open} style={styles.buttonContainer}>
      <ButtonContainer
        style={[styles.addButton, !useGlass && { backgroundColor: colors.card }]}
        {...(useGlass && { isInteractive: true })}
      >
        <Ionicons name="add" size={24} color={colors.primary} />
      </ButtonContainer>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'relative',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
