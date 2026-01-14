import { StyleSheet, Text, View } from 'react-native';

import PhraseForm from '@/components/PhraseForm';
import PhraseList from '@/components/PhraseList';
import { colors, spacing, typography } from '@/theme/colors';

// Plain component that receives phrases as props

const LibraryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <PhraseForm />
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Words & phrases</Text>

        <PhraseList />
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
