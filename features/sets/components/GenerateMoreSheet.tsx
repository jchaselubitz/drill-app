import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components';
import { useColors } from '@/hooks';

type GenerateMoreSheetProps = {
  visible: boolean;
  onClose: () => void;
  onGenerate: (count: number) => void;
};

const COUNT_OPTIONS = [5, 10, 20];

export function GenerateMoreSheet({ visible, onClose, onGenerate }: GenerateMoreSheetProps) {
  const colors = useColors();
  const [selectedCount, setSelectedCount] = useState(10);

  const handleGenerate = () => {
    onGenerate(selectedCount);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={[styles.title, { color: colors.text }]}>Generate More Phrases</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            How many phrases would you like to add?
          </Text>

          <View style={styles.options}>
            {COUNT_OPTIONS.map((count) => {
              const isSelected = selectedCount === count;
              return (
                <Pressable
                  key={count}
                  style={[
                    styles.option,
                    { borderColor: colors.border },
                    isSelected && {
                      borderColor: colors.primary,
                      backgroundColor: colors.primary + '10',
                    },
                  ]}
                  onPress={() => setSelectedCount(count)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isSelected ? colors.primary : colors.text },
                    ]}
                  >
                    {count}
                  </Text>
                  <Text
                    style={[
                      styles.optionSubtext,
                      { color: isSelected ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    phrases
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            <Button text="Generate" onPress={handleGenerate} />
            <Button text="Cancel" variant="secondary" onPress={onClose} />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerSpacer: {
    width: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    padding: 24,
    gap: 24,
  },
  label: {
    fontSize: 16,
    textAlign: 'center',
  },
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  option: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  optionText: {
    fontSize: 24,
    fontWeight: '700',
  },
  optionSubtext: {
    fontSize: 12,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
});
