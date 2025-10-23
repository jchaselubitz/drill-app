import { getPhrases } from '@/lib/actions/libraryActions';
import { Phrase } from '@/supabase/functions/_shared/types';
import { colors, spacing, typography } from '@/theme/colors';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { useLessonContext } from '@/context/LessonContext';

const LibraryScreen: React.FC = () => {
  // const { library } = useLessonContext();
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  useEffect(() => {
    getPhrases({
      pastDays: 30,
    }).then((phrases) => {
      setPhrases(phrases);
    });
  }, []);

  console.log('Phrases', phrases);

  const library = {
    terms: phrases.filter((phrase) => phrase.type === 'word'),
    concepts: phrases.filter((phrase) => phrase.type === 'concept'),
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.subtitle}>
        Manage the vocabulary and grammar concepts you want to review.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Words & phrases</Text>
        {library.terms.length === 0 ? (
          <Text style={styles.empty}>Save new words from lesson corrections to see them here.</Text>
        ) : (
          library.terms.map((item) => (
            <TouchableOpacity key={item.value} style={styles.entry}>
              <View>
                <Text style={styles.entryValue}>{item.value}</Text>
                {item.translation ? (
                  <Text style={styles.entryTranslation}>{item.translation}</Text>
                ) : null}
              </View>
              <View style={styles.pill}>
                <Text style={styles.pillLabel}>Focus ×{item.focusLevel}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Concepts</Text>
        {library.concepts.length === 0 ? (
          <Text style={styles.empty}>Add tricky grammar patterns to practice them more often.</Text>
        ) : (
          library.concepts.map((item) => (
            <TouchableOpacity key={item.value} style={styles.entry}>
              <Text style={styles.entryValue}>{item.value}</Text>
              <View style={styles.pill}>
                <Text style={styles.pillLabel}>Focus ×{item.focusLevel}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
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
  title: {
    fontSize: typography.header,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.subheader,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  empty: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  entryValue: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600',
  },
  entryTranslation: {
    color: colors.textSecondary,
  },
  pill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillLabel: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
});

export default LibraryScreen;
