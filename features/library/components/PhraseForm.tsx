import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import database from '@/database';
import Phrase from '@/database/models/Phrase';
import { colors, spacing, typography } from '@/theme/colors';

const PhraseForm: React.FC = () => {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('en');
  const [source, setSource] = useState('manual');
  const [type, setType] = useState('phrase');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      await Phrase.addPhrase(database, {
        text,
        lang,
        source,
        type,
        favorite: false,
        partSpeech: null,
        filename: null,
        note: null,
        difficulty: null,
        historyId: null,
        attemptId: null,
      });

      // Reset form
      setText('');
      setLang('en');
      setSource('manual');
      setType('phrase');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add phrase.';
      Alert.alert('Error', message);
      console.error('Error creating phrase:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Add New Phrase</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Enter phrase..."
        placeholderTextColor={colors.textSecondary}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Adding...' : 'Add Phrase'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: typography.subheader,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.body,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
});

export default PhraseForm;
