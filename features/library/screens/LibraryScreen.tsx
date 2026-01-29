import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { GlassContainer } from 'expo-glass-effect';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, getGlassAvailable, GlassCompatibleView, Select } from '@/components';
import { Languages } from '@/constants';
import { Phrase } from '@/database/models';
import { PHRASE_TABLE } from '@/database/schema';
import { AddPhraseModal, LibraryEmptyState, PhraseCard } from '@/features/library/components';
import { useColors } from '@/hooks';
import type { LanguageCode } from '@/types';

export default function LibraryScreen() {
  const colors = useColors();
  const db = useDatabase();
  const router = useRouter();

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [allPhrases, setAllPhrases] = useState<Phrase[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<LanguageCode | 'all'>('all');

  // Get unique languages from phrases
  const availableLanguages = useMemo(
    () => [...new Set(allPhrases.map((p) => p.lang))],
    [allPhrases]
  );
  const languageOptions: Array<{
    value: LanguageCode | 'all';
    label?: string;
    icon?: ComponentProps<typeof Ionicons>['name'];
  }> = [
    { value: 'all' as const, icon: 'filter' as const },
    ...Languages.filter((l) => availableLanguages.includes(l.code)).map((l) => ({
      value: l.code,
      label: `${l.icon} ${l.name}`,
    })),
  ];

  // Reset filter if selected language no longer exists
  useEffect(() => {
    if (languageFilter !== 'all' && !availableLanguages.includes(languageFilter)) {
      setLanguageFilter('all');
    }
  }, [availableLanguages, languageFilter]);

  // Subscribe to all phrases to track available languages
  useEffect(() => {
    const subscription = db.collections
      .get<Phrase>(PHRASE_TABLE)
      .query()
      .observe()
      .subscribe((results) => {
        setAllPhrases(results);
      });

    return () => subscription.unsubscribe();
  }, [db]);

  // Subscribe to filtered phrases
  useEffect(() => {
    const query = db.collections
      .get<Phrase>(PHRASE_TABLE)
      .query(
        ...(languageFilter !== 'all' ? [Q.where('lang', languageFilter)] : []),
        Q.sortBy('created_at', Q.desc)
      );

    const subscription = query.observe().subscribe((results) => {
      setPhrases(results);
    });

    return () => subscription.unsubscribe();
  }, [db, languageFilter]);

  const handlePhrasePress = (phraseId: string) => {
    router.push(`/phrase/${phraseId}` as any);
  };

  const useGlass = getGlassAvailable();
  const GlassWrapper = useGlass ? GlassContainer : View;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <GlassWrapper style={styles.glassWrapper} {...(useGlass ? { spacing: 12 } : {})}>
        <GlassCompatibleView
          style={styles.controlsContainer}
          fallbackStyle={{ borderColor: colors.border, borderWidth: 1 }}
          glassEffectStyle="regular"
          colorScheme="auto"
        >
          <Button
            text="Add Phrase"
            onPress={() => setIsModalVisible(true)}
            icon={{ name: 'add-circle' }}
            variant="primary"
            disableGlass={useGlass}
          />
          <View style={styles.filterContainer}>
            <Select
              placeholder={{ icon: 'filter', text: 'Filter' }}
              options={languageOptions}
              value={languageFilter}
              onValueChange={setLanguageFilter}
            />
          </View>
        </GlassCompatibleView>

        <FlatList
          data={phrases}
          renderItem={({ item }) => <PhraseCard phrase={item} onPress={handlePhrasePress} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            phrases.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={() => (
            <LibraryEmptyState onPressAdd={() => setIsModalVisible(true)} />
          )}
        />
      </GlassWrapper>
      <AddPhraseModal visible={isModalVisible} onClose={() => setIsModalVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glassWrapper: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  controlsContainer: {
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },

  filterContainer: {
    width: 'auto',
  },
  listContent: {
    paddingTop: 16,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
});
