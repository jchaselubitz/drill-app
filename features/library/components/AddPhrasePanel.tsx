import { Ionicons } from '@expo/vector-icons';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Select } from '@/components/Select';
import { TextInput } from '@/components/TextInput';
import { Languages } from '@/constants';
import { Phrase } from '@/database/models';
import { useColors } from '@/hooks';
import { detectLanguage } from '@/lib/ai/translate';
import type { LanguageCode } from '@/types';

const AUTO_DETECT = 'auto' as const;

type AddPhrasePanelProps = {
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
  onPhraseAdded?: () => void;
};

export function AddPhrasePanel({
  isExpanded,
  onToggleExpanded,
  onPhraseAdded,
}: AddPhrasePanelProps) {
  const colors = useColors();
  const db = useDatabase();
  const [text, setText] = useState('');
  const [lang, setLang] = useState<LanguageCode | typeof AUTO_DETECT>(AUTO_DETECT);
  const [isSaving, setIsSaving] = useState(false);

  const languageOptions = [
    { value: AUTO_DETECT, label: '✨ Detect automatically' },
    ...Languages.map((l) => ({
      value: l.code,
      label: `${l.icon} ${l.name}`,
    })),
  ];

  const handleSave = async () => {
    if (!text.trim()) return;

    setIsSaving(true);
    try {
      const detectedLang = lang === AUTO_DETECT ? await detectLanguage(text.trim()) : lang;

      await Phrase.addPhrase(db, {
        text: text.trim(),
        lang: detectedLang as LanguageCode,
        source: 'manual',
        partSpeech: null,
        favorite: false,
        filename: null,
        type: text.trim().includes(' ') ? 'phrase' : 'word',
        note: null,
        difficulty: null,
        historyId: null,
      });

      setText('');
      onToggleExpanded(false);
      onPhraseAdded?.();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable style={styles.header} onPress={() => onToggleExpanded(!isExpanded)}>
        <View style={styles.headerContent}>
          <Ionicons name="add-circle" size={20} color={colors.primary} />
          <Text style={[styles.headerText, { color: colors.text }]}>Add</Text>
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {isExpanded && (
        <View style={styles.form}>
          <TextInput
            placeholder="Enter a word or phrase..."
            value={text}
            onChangeText={setText}
            autoFocus
          />
          <Select label="Language" options={languageOptions} value={lang} onValueChange={setLang} />
          <Button title="Save" onPress={handleSave} loading={isSaving} disabled={!text.trim()} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 16,
    paddingTop: 0,
    gap: 16,
  },
});
