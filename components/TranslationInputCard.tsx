import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '@/theme/colors';

interface TranslationInputCardProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

const TranslationInputCard: React.FC<TranslationInputCardProps> = ({
  value,
  onChange,
  onSubmit,
  disabled,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Your translation</Text>
      <TextInput
        style={styles.input}
        multiline
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        placeholder="Type your translation here"
        placeholderTextColor={colors.textSecondary}
      />
      <TouchableOpacity
        style={[styles.button, disabled && styles.buttonDisabled]}
        onPress={onSubmit}
        disabled={disabled}
      >
        <Text style={styles.buttonText}>Submit response</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: typography.subheader,
    color: colors.textSecondary,
  },
  input: {
    minHeight: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: colors.background,
    fontSize: typography.subheader,
    fontWeight: '600',
  },
});

export default TranslationInputCard;
