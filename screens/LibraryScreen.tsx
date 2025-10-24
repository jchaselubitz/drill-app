import PhraseForm from '@/components/PhraseForm';
import database from '@/database';
import Phrase from '@/database/models/Phrase';
import { PHRASE_TABLE } from '@/database/schema';
import { colors, spacing, typography } from '@/theme/colors';
import { withObservables } from '@nozbe/watermelondb/react';

import { FlatList, StyleSheet, Text, View } from 'react-native';

// Plain component that receives phrases as props
const PhraseListComponent = ({ phrases }: { phrases: Phrase[] }) => {
  return (
    <FlatList
      data={phrases}
      renderItem={({ item }) => (
        <View style={styles.entry}>
          <Text style={styles.entryValue}>{item.text}</Text>
          <Text style={styles.entryTranslation}>{item.lang}</Text>
        </View>
      )}
      keyExtractor={(item) => item.id}
    />
  );
};

// Enhanced version with observables
const EnhancedPhraseList = withObservables([], () => ({
  phrases: database.get<Phrase>(PHRASE_TABLE).query().observe(),
}))(PhraseListComponent);

const LibraryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.subtitle}>
        Manage the vocabulary and grammar concepts you want to review.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Words & phrases</Text>
        <PhraseForm />
        <EnhancedPhraseList />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Concepts</Text>
        <Text style={styles.empty}>Add tricky grammar patterns to practice them more often.</Text>
      </View>
    </View>
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
