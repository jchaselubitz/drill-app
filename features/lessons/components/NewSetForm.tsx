import { StyleSheet, View } from 'react-native';

import { Button, TextInput } from '@/components';

type NewSetFormProps = {
  topic: string;
  onTopicChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
};

export function NewSetForm({ topic, onTopicChange, onGenerate, isLoading }: NewSetFormProps) {
  return (
    <View style={styles.form}>
      <TextInput
        label="What vocabulary do you want to learn?"
        placeholder="e.g., kitchen items, travel phrases, business vocabulary..."
        value={topic}
        onChangeText={onTopicChange}
      />

      <Button
        text="Generate Phrases"
        onPress={onGenerate}
        buttonState={isLoading ? 'loading' : !topic.trim() ? 'disabled' : 'default'}
        loadingText="Generating..."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
