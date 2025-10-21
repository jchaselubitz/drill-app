import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import LibraryList from '@/components/LibraryList';
import { useLibrary } from '@/state/LibraryProvider';

const LibraryScreen: React.FC = () => {
  const { phrases, concepts } = useLibrary();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Library</Text>
      <Text style={styles.subtitle}>
        Review the vocabulary and grammar patterns you have saved from your lessons. Adjust the
        frequency in Supabase or the settings screen.
      </Text>
      <View style={styles.section}>
        <LibraryList title="Saved phrases" items={phrases} />
      </View>
      <View style={styles.section}>
        <LibraryList title="Grammar concepts" items={concepts} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  content: {
    padding: 16,
    gap: 24
  },
  heading: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827'
  },
  subtitle: {
    fontSize: 15,
    color: '#4B5563'
  },
  section: {
    gap: 16
  }
});

export default LibraryScreen;
