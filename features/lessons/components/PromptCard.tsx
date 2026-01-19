import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card } from '@/components';
import { useColors } from '@/hooks';

type PromptCardProps = {
  prompt: string;
  onMakeShorter: () => void;
  onMakeLonger: () => void;
  onSave: () => void;
  isLoading?: boolean;
  isSaving?: boolean;
};

export function PromptCard({
  prompt,
  onMakeShorter,
  onMakeLonger,
  onSave,
  isLoading = false,
  isSaving = false,
}: PromptCardProps) {
  const colors = useColors();

  return (
    <Card style={styles.promptCard}>
      <View style={styles.promptHeader}>
        <Ionicons name="bulb" size={20} color={colors.primary} />
        <Text style={[styles.promptLabel, { color: colors.textSecondary }]}>
          Your Writing Prompt
        </Text>
      </View>
      <Text style={[styles.promptText, { color: colors.text }]} selectable>
        {prompt}
      </Text>
      <View style={styles.promptActions}>
        <Button
          text="Shorter"
          variant="secondary"
          onPress={onMakeShorter}
          buttonState={isLoading || isSaving ? 'disabled' : 'default'}
        />
        <Button
          text="Longer"
          variant="secondary"
          onPress={onMakeLonger}
          buttonState={isLoading || isSaving ? 'disabled' : 'default'}
        />
      </View>
      <Button
        text="Save Lesson"
        onPress={onSave}
        buttonState={isSaving ? 'loading' : isLoading ? 'disabled' : 'default'}
        loadingText="Saving..."
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  promptCard: {
    gap: 12,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  promptText: {
    fontSize: 17,
    lineHeight: 26,
  },
  promptActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
