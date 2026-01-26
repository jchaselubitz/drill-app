import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Select } from '@/components/Select';
import { useSettings } from '@/contexts/SettingsContext';
import { Deck, DeckTranslation } from '@/database/models';
import { DECK_TABLE, DECK_TRANSLATION_TABLE } from '@/database/schema';
import { useColors, useDeckReviewStats } from '@/hooks';
import { ensureSrsCardsForTranslation } from '@/lib/srs/cards';

export default function ReviewHomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const db = useDatabase();
  const { settings, updateSettings } = useSettings();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    dueReviews,
    dueNew,
    newRemaining,
    reviewsRemaining,
    isLoading: isLoadingStats,
    refresh: refreshStats,
  } = useDeckReviewStats(settings.activeDeckId ?? undefined, {
    dayStartHour: settings.dayStartHour,
    maxNewPerDay: settings.maxNewPerDay,
    maxReviewsPerDay: settings.maxReviewsPerDay,
  });

  useEffect(() => {
    const subscription = db.collections
      .get<Deck>(DECK_TABLE)
      .query(Q.where('archived', false))
      .observe()
      .subscribe((results) => {
        setDecks(results);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [db]);

  useEffect(() => {
    const ensureDefault = async () => {
      const defaultDeck = await Deck.getOrCreateDefault(db);
      if (!settings.activeDeckId) {
        await updateSettings({ activeDeckId: defaultDeck.id });
      }
    };

    ensureDefault();
  }, [db, settings.activeDeckId, updateSettings]);

  const handleRefresh = async () => {
    if (!settings.activeDeckId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const deckTranslations = await db.collections
        .get<DeckTranslation>(DECK_TRANSLATION_TABLE)
        .query(Q.where('deck_id', settings.activeDeckId))
        .fetch();

      const nowMs = Date.now();
      for (const deckTranslation of deckTranslations) {
        await ensureSrsCardsForTranslation(db, {
          deckId: settings.activeDeckId,
          translationId: deckTranslation.translationId,
          nowMs,
        });
      }

      await refreshStats();
    } finally {
      setIsRefreshing(false);
    }
  };

  const deckOptions = decks.map((deck) => ({ value: deck.id, label: deck.name }));
  const activeDeckLabel =
    decks.find((deck) => deck.id === settings.activeDeckId)?.name ?? 'Select deck';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <Stack.Screen
        options={{
          title: 'Review',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Deck</Text>
          {decks.length > 0 && settings.activeDeckId ? (
            <Select
              options={deckOptions}
              value={settings.activeDeckId}
              onValueChange={(value: string) => updateSettings({ activeDeckId: value })}
            />
          ) : (
            <Text style={{ color: colors.textSecondary }}>
              {isLoading ? 'Loading decks...' : activeDeckLabel}
            </Text>
          )}

          <View style={styles.deckActions}>
            <Button text="Manage Decks" variant="secondary" onPress={() => router.push('/decks')} />
            <Button
              text="Refresh"
              variant="secondary"
              icon={{ name: 'refresh', position: 'left', size: 18 }}
              onPress={handleRefresh}
              buttonState={isRefreshing ? 'loading' : 'default'}
              loadingText="Refreshing..."
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Due reviews</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{dueReviews}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>New due</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{dueNew}</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Reviews remaining
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{reviewsRemaining}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>New remaining</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{newRemaining}</Text>
            </View>
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Audio</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                Auto-play review audio
              </Text>
              <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                Play audio automatically when a phrase appears.
              </Text>
            </View>
            <Switch
              value={settings.autoPlayReviewAudio}
              onValueChange={(value) => updateSettings({ autoPlayReviewAudio: value })}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.background}
              ios_backgroundColor={colors.border}
            />
          </View>
        </Card>

        <Button
          text="Start Review"
          onPress={() => router.push(`/session?deckId=${settings.activeDeckId}`)}
          buttonState={
            isLoadingStats || dueReviews + dueNew === 0 || !settings.activeDeckId
              ? 'disabled'
              : 'default'
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  deckActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 12,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingText: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
  },
});
