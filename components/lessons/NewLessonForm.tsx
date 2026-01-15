import { StyleSheet, View } from 'react-native';

import { Button, TextInput } from '@/components';

type NewLessonFormProps = {
  topic: string;
  onTopicChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
};

export function NewLessonForm({ topic, onTopicChange, onGenerate, isLoading }: NewLessonFormProps) {
  return (
    <View style={styles.form}>
      <TextInput
        label="What should I write about?"
        placeholder="e.g., my favorite vacation, a day at work..."
        value={topic}
        onChangeText={onTopicChange}
      />

      {/* <TextInput
        label="Related phrases (optional)"
        placeholder="Comma-separated phrases to practice"
        value={phrases}
        onChangeText={setPhrases}
      /> */}

      <Button
        title="Generate Lesson"
        onPress={onGenerate}
        loading={isLoading}
        disabled={!topic.trim()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
