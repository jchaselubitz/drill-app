import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CEFR_LEVELS, Languages } from '@/constants';
import { useColors } from '@/hooks';
import type { CEFRLevel, LanguageCode } from '@/types';

type LessonSettingsDisplayProps = {
  topicLanguage: LanguageCode;
  level: CEFRLevel;
  onSettingsPress?: () => void;
};

export function LessonSettingsDisplay({
  topicLanguage,
  level,
  onSettingsPress,
}: LessonSettingsDisplayProps) {
  const colors = useColors();
  const router = useRouter();

  const topicLang = Languages.find((lang) => lang.code === topicLanguage);
  const levelInfo = CEFR_LEVELS.find((l) => l.level === level);

  const handleSettingsPress = () => {
    if (onSettingsPress) {
      onSettingsPress();
    }
    router.push('/(tabs)/settings' as any);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {topicLang ? `${topicLang.icon} ${topicLang.name}` : topicLanguage} •{' '}
        {levelInfo ? `${levelInfo.level} - ${levelInfo.name}` : level}
      </Text>
      <Pressable onPress={handleSettingsPress} style={styles.button}>
        <Ionicons name="settings-outline" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
  },
  button: {
    padding: 4,
  },
});
