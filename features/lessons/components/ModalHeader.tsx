import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
  closeButtonText?: string;
};

export function ModalHeader({ title, onClose, closeButtonText = 'Cancel' }: ModalHeaderProps) {
  const colors = useColors();

  return (
    <>
      <View style={styles.dragHandleContainer}>
        <View style={[styles.dragHandle, { backgroundColor: colors.textSecondary }]} />
      </View>

      <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, { color: colors.primary }]}>{closeButtonText}</Text>
        </Pressable>
        <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
        <View style={styles.headerSpacer} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    opacity: 0.3,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  closeButton: {
    minWidth: 60,
  },
  closeButtonText: {
    fontSize: 17,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  headerSpacer: {
    minWidth: 60,
  },
});
