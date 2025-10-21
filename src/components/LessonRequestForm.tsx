import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import type { ProficiencyLevel } from '@/types';

type FormState = {
  targetLanguage: string;
  proficiency: ProficiencyLevel;
  topic: string;
  nativeLanguage: string;
};

interface LessonRequestFormProps {
  value: FormState;
  onChange: (value: FormState) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

const levels: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const LessonRequestForm: React.FC<LessonRequestFormProps> = ({ value, onChange, onSubmit, isLoading }) => {
  const isValid = useMemo(() => value.targetLanguage && value.topic && value.nativeLanguage, [value]);

  return (
    <View style={styles.container}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Target language</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. German"
          value={value.targetLanguage}
          onChangeText={(text) => onChange({ ...value, targetLanguage: text })}
          autoCapitalize="words"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Proficiency level</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={value.proficiency}
            onValueChange={(level) => onChange({ ...value, proficiency: level as ProficiencyLevel })}
          >
            {levels.map((level) => (
              <Picker.Item key={level} label={level} value={level} />
            ))}
          </Picker>
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Native language</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. English"
          value={value.nativeLanguage}
          onChangeText={(text) => onChange({ ...value, nativeLanguage: text })}
          autoCapitalize="words"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Topic or concept</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="Verb adjective agreement"
          value={value.topic}
          onChangeText={(text) => onChange({ ...value, topic: text })}
          multiline
        />
      </View>
      <Pressable
        accessibilityRole="button"
        disabled={!isValid || isLoading}
        onPress={onSubmit}
        style={({ pressed }) => [
          styles.submitButton,
          (pressed || isLoading) && { opacity: 0.7 },
          (!isValid || isLoading) && { backgroundColor: '#9CA3AF' }
        ]}
      >
        <Text style={styles.submitText}>{isLoading ? 'Generating…' : 'Start lesson'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 24,
    padding: 16
  },
  fieldGroup: {
    gap: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827'
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16
  },
  multilineInput: {
    minHeight: 72,
    textAlignVertical: 'top'
  },
  pickerWrapper: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF'
  },
  submitButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16
  }
});

export default LessonRequestForm;
