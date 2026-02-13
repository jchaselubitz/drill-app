import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Deck, Lesson } from '@/database/models';
import { LESSON_TABLE } from '@/database/schema';
import { useColors } from '@/hooks';
import { linkFreeItemsToTopic } from '@/lib/services/subjectService';

type PromptPickerModalProps = {
  visible: boolean;
  deck: Deck | null;
  onClose: () => void;
};

export function PromptPickerModal({ visible, deck, onClose }: PromptPickerModalProps) {
  const colors = useColors();
  const db = useDatabase();
  const router = useRouter();
  const [freeLessons, setFreeLessons] = useState<Lesson[]>([]);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const fetchFreeLessons = async () => {
      const lessons = await db.collections
        .get<Lesson>(LESSON_TABLE)
        .query(Q.where('subject_id', null), Q.sortBy('created_at', Q.desc))
        .fetch();
      setFreeLessons(lessons);
    };

    fetchFreeLessons();
  }, [visible, db]);

  const handleSelect = async (lesson: Lesson) => {
    if (!deck || linking) return;
    setLinking(true);
    try {
      const subject = await linkFreeItemsToTopic(db, { lesson, deck });
      onClose();
      router.push(`/subject/${subject.id}` as any);
    } catch {
      setLinking(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Link to Prompt</Text>
          <Pressable onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>
        {freeLessons.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No free prompts available. Create a standalone prompt first.
            </Text>
          </View>
        ) : (
          <FlatList
            data={freeLessons}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => handleSelect(item)}
                disabled={linking}
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.topic}
                </Text>
                <Text
                  style={[styles.itemPrompt, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {item.prompt}
                </Text>
                <View style={styles.itemMeta}>
                  <Text style={[styles.itemMetaText, { color: colors.primary }]}>{item.level}</Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 16,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  item: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrompt: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  itemMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  itemMetaText: {
    fontSize: 13,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
});
