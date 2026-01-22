import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from 'react-native';

import { useColors } from '@/hooks';

const BUTTON_SIZE = 44;
const BUTTON_GAP = 8;

type AttemptFormProps = {
  paragraph: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  onCancel: () => void;
};

export function AttemptForm({
  paragraph,
  onChangeText,
  onSubmit,
  onCancel,
  isLoading,
}: AttemptFormProps) {
  const colors = useColors();
  const isDisabled = !paragraph.trim();

  return (
    <View style={styles.attemptForm}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Response</Text>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <RNTextInput
          placeholder="Write your paragraph here..."
          value={paragraph}
          onChangeText={onChangeText}
          multiline
          numberOfLines={6}
          style={[styles.textArea, { color: colors.text }]}
          placeholderTextColor={colors.textSecondary}
          textAlignVertical="top"
        />
        <View style={styles.buttonRow}>
          <Pressable
            style={({ pressed }) => [
              styles.iconButton,
              isLoading && styles.iconButtonLoading,
              {
                backgroundColor: isDisabled ? colors.border : colors.primary,
                opacity: pressed && !isDisabled ? 0.8 : 1,
              },
            ]}
            onPress={isLoading ? onCancel : onSubmit}
            disabled={isDisabled && !isLoading}
            accessibilityLabel={isLoading ? 'Cancel request' : 'Submit attempt'}
          >
            {isLoading ? (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="small" color={colors.primaryText} />
                <Ionicons name="stop" size={18} color={colors.primaryText} />
              </View>
            ) : (
              <Ionicons name="send" size={18} color={colors.primaryText} />
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  attemptForm: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  inputContainer: {
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 140,
  },
  textArea: {
    flex: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: BUTTON_SIZE + BUTTON_GAP * 2,
    fontSize: 16,
    minHeight: 120,
  },
  buttonRow: {
    position: 'absolute',
    bottom: BUTTON_GAP,
    right: BUTTON_GAP,
    flexDirection: 'row',
    gap: BUTTON_GAP,
  },
  iconButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonLoading: {
    width: 'auto',
    paddingHorizontal: 16,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
