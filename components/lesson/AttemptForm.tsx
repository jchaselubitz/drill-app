import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, TextInput } from '@/components';
import { useColors } from '@/hooks';

type AttemptFormProps = {
  paragraph: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
};

export function AttemptForm({
  paragraph,
  onChangeText,
  onSubmit,
  onCancel,
  isLoading,
}: AttemptFormProps) {
  const colors = useColors();

  return (
    <View style={styles.attemptForm}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Response</Text>
      <TextInput
        placeholder="Write your paragraph here..."
        value={paragraph}
        onChangeText={onChangeText}
        multiline
        numberOfLines={6}
        style={styles.textArea}
        textAlignVertical="top"
      />
      {isLoading ? (
        <View style={styles.submitRow}>
          <Button
            title="Submit Attempt"
            onPress={onSubmit}
            loading
            disabled={!paragraph.trim()}
            style={styles.submitButton}
          />
          <Pressable
            style={({ pressed }) => [
              styles.stopButton,
              { backgroundColor: colors.error, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={onCancel}
            accessibilityLabel="Cancel request"
          >
            <Ionicons name="stop-circle" size={22} color={colors.primaryText} />
          </Pressable>
        </View>
      ) : (
        <Button title="Submit Attempt" onPress={onSubmit} disabled={!paragraph.trim()} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  attemptForm: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 120,
  },
  submitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  submitButton: {
    flex: 1,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
