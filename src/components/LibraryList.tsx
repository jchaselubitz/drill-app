import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import type { LibraryItem } from '@/types';

interface LibraryListProps {
  title: string;
  items: LibraryItem[];
  onPressItem?: (item: LibraryItem) => void;
}

const LibraryList: React.FC<LibraryListProps> = ({ title, items, onPressItem }) => {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressItem?.(item)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.cardTitle}>
              {item.type === 'phrase' ? item.content : item.concept}
            </Text>
            {item.type === 'phrase' && item.translation ? (
              <Text style={styles.translation}>{item.translation}</Text>
            ) : null}
            <View style={styles.metaRow}>
              <View style={[styles.frequencyTag, frequencyColor(item.frequency)]}>
                <Text style={styles.frequencyText}>{item.frequency}</Text>
              </View>
              <Text style={styles.metaText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No items yet. Add some from a lesson.</Text>
          </View>
        )}
      />
    </View>
  );
};

function frequencyColor(frequency: LibraryItem['frequency']) {
  switch (frequency) {
    case 'high':
      return { backgroundColor: '#FEE2E2' };
    case 'medium':
      return { backgroundColor: '#FEF3C7' };
    case 'low':
    default:
      return { backgroundColor: '#DCFCE7' };
  }
}

const styles = StyleSheet.create({
  section: {
    gap: 12
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827'
  },
  card: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827'
  },
  translation: {
    fontSize: 14,
    color: '#4B5563'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  frequencyTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  frequencyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize'
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280'
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280'
  }
});

export default LibraryList;
