import { LanguagesISO639, ProficiencyLevel } from '@/lib/lists';
import { RootStackParamList } from '@/old/RootNavigator';
import { colors, spacing, typography } from '@/theme/colors';
import { LessonRequest } from '@/types/lesson';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const languages = Object.values(LanguagesISO639);
const levels: ProficiencyLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const nativeLanguages = Object.values(LanguagesISO639);

type Props = NativeStackScreenProps<RootStackParamList, 'LessonRequest'>;

const LessonRequestScreen: React.FC<Props> = ({ navigation }) => {
  // const { createLesson, isGenerating } = useLessonSession();
  const [language, setLanguage] = useState(languages[0]);
  const [nativeLanguage, setNativeLanguage] = useState(nativeLanguages[0]);
  const [level, setLevel] = useState<ProficiencyLevel>('B1');
  const [topic, setTopic] = useState('Verb adjective agreement');

  const isValid = useMemo(() => topic.trim().length > 3, [topic]);

  const handleSubmit = async () => {
    if (!isValid) return;
    const request: LessonRequest = { language, nativeLanguage, level, topic };
    // await createLesson({ request });
    navigation.navigate('LessonSession');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Configure your next drill</Text>
        <Text style={styles.label}>Target language</Text>
        <View style={styles.selectionRow}>
          {languages.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, language === item && styles.chipActive]}
              onPress={() => setLanguage(item)}
            >
              <Text style={[styles.chipText, language === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Native language</Text>
        <View style={styles.selectionRow}>
          {nativeLanguages.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, nativeLanguage === item && styles.chipActive]}
              onPress={() => setNativeLanguage(item)}
            >
              <Text style={[styles.chipText, nativeLanguage === item && styles.chipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Level</Text>
        <View style={styles.selectionRow}>
          {levels.map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, level === item && styles.chipActive]}
              onPress={() => setLevel(item)}
            >
              <Text style={[styles.chipText, level === item && styles.chipTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Topic or focus</Text>
        <TextInput
          value={topic}
          onChangeText={setTopic}
          placeholder="Describe what you want to practice"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />
        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleSubmit}
          // disabled={!isValid || isGenerating}
        >
          <Text style={styles.buttonText}>
            {/* {isGenerating ? 'Creating lesson…' : 'Start lesson'} */}
            Start lesson
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heading: {
    fontSize: typography.header,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  label: {
    fontSize: typography.subheader,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  selectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    borderRadius: 18,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  chipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    color: colors.textPrimary,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    fontSize: typography.subheader,
    color: colors.background,
    fontWeight: '600',
  },
});

export default LessonRequestScreen;
