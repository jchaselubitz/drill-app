import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/RootNavigator';
import { colors, spacing, typography } from '@/theme/colors';
import LessonPromptCard from '@/components/LessonPromptCard';
import TranslationInputCard from '@/components/TranslationInputCard';
import CorrectionCard from '@/components/CorrectionCard';
import ScoreSummary from '@/components/ScoreSummary';
import { useLessonContext } from '@/context/LessonContext';
import { useLessonSession } from '@/hooks/useLessonSession';

type Props = NativeStackScreenProps<RootStackParamList, 'LessonSession'>;

const LessonSessionScreen: React.FC<Props> = () => {
  const { activeLesson, recentScores, addLibraryItem } = useLessonContext();
  const { submitAnswer } = useLessonSession();
  const [translation, setTranslation] = useState('');
  const [isSubmitted, setSubmitted] = useState(false);
  const [lastCorrection, setLastCorrection] = useState<{
    original: string;
    corrected: string;
  } | null>(null);

  const currentItem = useMemo(() => {
    if (!activeLesson) return undefined;
    return activeLesson.items[activeLesson.currentIndex] ?? activeLesson.items.at(-1);
  }, [activeLesson]);

  const hasCompletedLesson = useMemo(() => {
    if (!activeLesson) return false;
    return activeLesson.currentIndex >= activeLesson.items.length;
  }, [activeLesson]);

  const handleSubmit = async () => {
    if (!translation.trim()) {
      Alert.alert('Enter translation', 'Please enter your best attempt before submitting.');
      return;
    }
    const item = currentItem;
    await submitAnswer({
      spelling: Math.floor(Math.random() * 20) + 80,
      grammar: Math.floor(Math.random() * 20) + 75,
    });
    if (item) {
      setLastCorrection({ original: translation, corrected: item.suggestedAnswer });
      setSubmitted(true);
    }
    setTranslation('');
  };

  if (!activeLesson) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No active lesson</Text>
        <Text style={styles.emptySubtitle}>Go back and create a new drill to get started.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{activeLesson.request.topic}</Text>
          <Text style={styles.subtitle}>
            {activeLesson.request.language} • {activeLesson.request.level}
          </Text>
        </View>
        <Text style={styles.counter}>
          {Math.min(activeLesson.currentIndex + 1, activeLesson.items.length)} /{' '}
          {activeLesson.items.length}
        </Text>
      </View>

      <ScoreSummary recentScores={recentScores} />

      {currentItem ? (
        <LessonPromptCard
          prompt={currentItem.prompt}
          focusTerms={currentItem.focus?.terms}
          focusConcepts={currentItem.focus?.concepts}
          onAddTerm={(term) => addLibraryItem('terms', term)}
          onAddConcept={(concept) => addLibraryItem('concepts', concept)}
        />
      ) : null}

      <TranslationInputCard
        value={translation}
        onChange={(value) => {
          setTranslation(value);
          setSubmitted(false);
          setLastCorrection((previous) => (value ? previous : null));
        }}
        onSubmit={handleSubmit}
        disabled={hasCompletedLesson}
      />

      {isSubmitted && lastCorrection ? (
        <CorrectionCard
          original={lastCorrection.original || '—'}
          corrected={lastCorrection.corrected}
          differenceHint="Scoring placeholder: integrate AI feedback via Supabase function."
        />
      ) : null}

      {hasCompletedLesson ? (
        <View style={styles.completionCard}>
          <Text style={styles.completionTitle}>Lesson complete</Text>
          <Text style={styles.completionSubtitle}>
            Great work! Add any focus areas to your library and start a new drill when you're ready.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.header,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  counter: {
    color: colors.textSecondary,
    fontSize: typography.subheader,
  },
  emptyState: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: typography.header,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  completionCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 20,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  completionTitle: {
    color: colors.textPrimary,
    fontSize: typography.subheader,
    fontWeight: '600',
  },
  completionSubtitle: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default LessonSessionScreen;
