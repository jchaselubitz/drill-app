import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';

type SelectProps<T> = {
  label?: string;
  labelIcon?: ComponentProps<typeof Ionicons>['name'];
  placeholder?: {
    text?: string;
    icon?: ComponentProps<typeof Ionicons>['name'];
  };
  options: { value: T; label?: string; icon?: ComponentProps<typeof Ionicons>['name'] }[];
  value: T;
  onValueChange: (value: T) => void;
};

export function Select<T extends string>({
  label,
  labelIcon,
  placeholder,
  options,
  value,
  onValueChange,
}: SelectProps<T>) {
  const [visible, setVisible] = useState(false);
  const colors = useColors();

  const selectedOption = options.find((o) => o.value === value);

  const renderTriggerContent = () => {
    if (selectedOption) {
      // If selected option has both icon and label, show both
      if (selectedOption.icon && selectedOption.label) {
        return (
          <View style={styles.triggerContent}>
            <Ionicons name={selectedOption.icon} size={20} color={colors.text} />
            <Text style={[styles.triggerText, { color: colors.text }]}>{selectedOption.label}</Text>
          </View>
        );
      }
      // If selected option has only label, show label
      if (selectedOption.label) {
        return (
          <Text style={[styles.triggerText, { color: colors.text }]}>{selectedOption.label}</Text>
        );
      }
      // If selected option has only icon, show icon
      if (selectedOption.icon) {
        return (
          <View style={{ paddingRight: 6 }}>
            <Ionicons name={selectedOption.icon} size={20} color={colors.text} />
          </View>
        );
      }
    }

    // Show placeholder when no option is selected or selected option has no display
    if (placeholder) {
      return (
        <View style={styles.placeholderContent}>
          {placeholder.icon && (
            <Ionicons name={placeholder.icon} size={20} color={colors.textSecondary} />
          )}
          {placeholder.text && (
            <Text style={[styles.triggerText, { color: colors.textSecondary }]}>
              {placeholder.text}
            </Text>
          )}
        </View>
      );
    }

    return <Text style={[styles.triggerText, { color: colors.textSecondary }]}>Select...</Text>;
  };

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          {labelIcon && <Ionicons name={labelIcon} size={16} color={colors.text} />}
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        </View>
      )}
      <Pressable
        style={[styles.trigger, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setVisible(true)}
      >
        {renderTriggerContent()}
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View
            style={[
              styles.dropdown,
              { backgroundColor: colors.background, borderColor: colors.border },
            ]}
          >
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
                  <View style={styles.optionContent}>
                    {item.icon && <Ionicons name={item.icon} size={20} color={colors.text} />}
                    {item.label && (
                      <Text style={[styles.optionText, { color: colors.text }]}>{item.label}</Text>
                    )}
                  </View>
                  {item.value === value && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: 16,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeholderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    maxHeight: 300,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionText: {
    fontSize: 16,
  },
});
