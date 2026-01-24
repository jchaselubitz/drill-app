import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, TextInput } from '@/components';
import { useColors } from '@/hooks';
import type { PhraseType } from '@/types';

type NewSetFormProps = {
  topic: string;
  onTopicChange: (text: string) => void;
  phraseType: PhraseType;
  onPhraseTypeChange: (type: PhraseType) => void;
  onGenerate: () => void;
  isLoading: boolean;
};

const PHRASE_TYPE_OPTIONS: { value: PhraseType; label: string }[] = [
  { value: 'words', label: 'Words' },
  { value: 'phrases', label: 'Phrases' },
  { value: 'sentences', label: 'Sentences' },
];

export function NewSetForm({
  topic,
  onTopicChange,
  phraseType,
  onPhraseTypeChange,
  onGenerate,
  isLoading,
}: NewSetFormProps) {
  const colors = useColors();

  return (
    <View style={styles.form}>
      <View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
        <View style={styles.segmentedControl}>
          {PHRASE_TYPE_OPTIONS.map((option, index) => {
            const isSelected = phraseType === option.value;
            const isLast = index === PHRASE_TYPE_OPTIONS.length - 1;
            return (
              <Pressable
                key={option.value}
                style={[
                  styles.segment,
                  { borderColor: colors.border },
                  isLast && { borderRightWidth: 1 },
                  isSelected && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => onPhraseTypeChange(option.value)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    { color: isSelected ? '#fff' : colors.text },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

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
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRightWidth: 0,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
