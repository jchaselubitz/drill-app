import { Ionicons } from '@expo/vector-icons';
import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Languages } from '@/constants';
import { Phrase } from '@/database/models';
import { PHRASE_TABLE } from '@/database/schema';
import { AddPhrasePanel, LibraryEmptyState, PhraseCard } from '@/features/library/components';
import { useColors } from '@/hooks';
import type { LanguageCode } from '@/types';

export default function LibraryScreen() {
  const colors = useColors();
  const db = useDatabase();
  const router = useRouter();

  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [allPhrases, setAllPhrases] = useState<Phrase[]>([]);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<LanguageCode | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get unique languages from phrases
  const availableLanguages = useMemo(
    () => [...new Set(allPhrases.map((p) => p.lang))],
    [allPhrases]
  );
  const languageOptions = [
    { value: 'all' as const, label: 'All Languages', icon: '' },
    ...Languages.filter((l) => availableLanguages.includes(l.code)).map((l) => ({
      value: l.code,
      label: l.name,
      icon: l.icon,
    })),
  ];

  const selectedLanguage = languageOptions.find((l) => l.value === languageFilter);

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

  const handleToggleFavorite = async (phrase: Phrase) => {
    await phrase.updateFavorite(!phrase.favorite);
  };

  const handlePhrasePress = (phraseId: string) => {
    router.push(`/phrase/${phraseId}` as any);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <View style={styles.content}>
        <View style={styles.panelContainer}>
          <AddPhrasePanel isExpanded={isPanelExpanded} onToggleExpanded={setIsPanelExpanded} />
          <View style={styles.filterContainer}>
            <Pressable
              style={[
                styles.filterButton,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Text style={[styles.filterText, { color: colors.text }]}>
                {selectedLanguage?.icon} {selectedLanguage?.label}
              </Text>
              <Ionicons
                name={isFilterOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
            {isFilterOpen && (
              <View
                style={[
                  styles.filterDropdown,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <ScrollView nestedScrollEnabled>
                  {languageOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.filterOption,
                        option.value === languageFilter && { backgroundColor: colors.background },
                      ]}
                      onPress={() => {
                        setLanguageFilter(option.value);
                        setIsFilterOpen(false);
                      }}
                    >
                      <Text style={[styles.filterOptionText, { color: colors.text }]}>
                        {option.icon} {option.label}
                      </Text>
                      {option.value === languageFilter && (
                        <Ionicons name="checkmark" size={16} color={colors.primary} />
                      )}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
        <FlatList
          data={phrases}
          renderItem={({ item }) => (
            <PhraseCard
              phrase={item}
              onPress={handlePhrasePress}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            phrases.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={() => (
            <LibraryEmptyState onPressAdd={() => setIsPanelExpanded(true)} />
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  panelContainer: {
    padding: 16,
    paddingBottom: 0,
    zIndex: 1,
  },
  filterContainer: {
    marginTop: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  filterText: {
    fontSize: 14,
    marginRight: 4,
  },
  filterDropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
    minWidth: 180,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  filterOptionText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
});
