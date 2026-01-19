import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { TextInput } from '@/components/TextInput';
import { useSettings } from '@/contexts/SettingsContext';
import { Deck } from '@/database/models';
import { DECK_TABLE } from '@/database/schema';
import { useColors } from '@/hooks';

export default function DecksScreen() {
  const colors = useColors();
  const db = useDatabase();
  const { settings, updateSettings } = useSettings();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [newDeckName, setNewDeckName] = useState('');

  useEffect(() => {
    Deck.getOrCreateDefault(db).catch((error) => {
      console.error('Failed to ensure default deck:', error);
    });

    const subscription = db.collections
      .get<Deck>(DECK_TABLE)
      .query(Q.where('archived', false))
      .observe()
      .subscribe((results) => {
        setDecks(results);
      });

    return () => subscription.unsubscribe();
  }, [db]);

  const handleCreateDeck = async () => {
    const trimmed = newDeckName.trim();
    if (!trimmed) return;

    await Deck.createDeck(db, trimmed);
    setNewDeckName('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Decks',
          headerShown: true,
          headerBackTitle: 'Review',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.explanation, { color: colors.textSecondary }]}>
          Create a deck here and then add phrases to it in your library.
        </Text>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Create Deck</Text>
          <View style={styles.createRow}>
            <TextInput
              placeholder="Deck name"
              value={newDeckName}
              onChangeText={setNewDeckName}
              containerStyle={styles.input}
            />
            <Button
              text="Add"
              onPress={handleCreateDeck}
              buttonState={newDeckName.trim() ? 'default' : 'disabled'}
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Decks</Text>
          <View style={styles.deckList}>
            {decks.map((deck) => {
              const isActive = deck.id === settings.activeDeckId;
              return (
                <Pressable
                  key={deck.id}
                  style={[
                    styles.deckRow,
                    {
                      borderColor: isActive ? colors.primary : colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                  onPress={() => updateSettings({ activeDeckId: deck.id })}
                >
                  <View>
                    <Text style={[styles.deckName, { color: colors.text }]}>{deck.name}</Text>
                    {deck.isDefault && (
                      <Text style={[styles.deckMeta, { color: colors.textSecondary }]}>
                        Default deck
                      </Text>
                    )}
                  </View>
                  {isActive && (
                    <Text style={[styles.activeBadge, { color: colors.primary }]}>Active</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>
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
  explanation: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  createRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
  },
  deckList: {
    gap: 12,
  },
  deckRow: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deckName: {
    fontSize: 16,
    fontWeight: '600',
  },
  deckMeta: {
    fontSize: 12,
    marginTop: 4,
  },
  activeBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
});
