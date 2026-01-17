import { StyleSheet, Text, View } from 'react-native';

import { Button, TextInput } from '@/components';
import { useColors } from '@/hooks';

type AttemptFormProps = {
  paragraph: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function AttemptForm({
  paragraph,
  onChangeText,
  onSubmit,
  isLoading,
}: AttemptFormProps) {
  const colors = useColors();

  const getButtonState = () => {
    if (isLoading) return 'loading';
    if (!paragraph.trim()) return 'disabled';
    return 'default';
  };

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
      <Button
        text="Submit Attempt"
        onPress={onSubmit}
        buttonState={getButtonState()}
        loadingText="Submitting..."
      />
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
});
