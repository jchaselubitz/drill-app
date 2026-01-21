import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';

type MetadataChipProps<T> = {
  icon?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onValueChange: (value: T) => void;
  showLabel?: boolean;
};

export function MetadataChip<T extends string>({
  icon,
  iconName,
  label,
  options,
  value,
  onValueChange,
  showLabel = true,
}: MetadataChipProps<T>) {
  const [visible, setVisible] = useState(false);
  const colors = useColors();

  const selectedOption = options.find((o) => o.value === value);
  const displayText = showLabel ? (selectedOption?.label ?? label) : '';

  return (
    <>
      <Pressable
        style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setVisible(true)}
      >
        {icon && <Text style={styles.icon}>{icon}</Text>}
        {iconName && !icon && <Ionicons name={iconName} size={14} color={colors.textSecondary} />}
        {displayText ? (
          <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
            {displayText}
          </Text>
        ) : null}
        <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View
            style={[
              styles.dropdown,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
            <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.dropdownTitle, { color: colors.textSecondary }]}>{label}</Text>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.option, item.value === value && { backgroundColor: colors.card }]}
                  onPress={() => {
                    onValueChange(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  icon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 100,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 350,
    overflow: 'hidden',
  },
  dropdownHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  optionText: {
    fontSize: 16,
  },
});
