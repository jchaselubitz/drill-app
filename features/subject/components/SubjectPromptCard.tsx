import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components';
import type Lesson from '@/database/models/Lesson';
import type { PromptLanguageType } from '@/database/models/Lesson';
import { useColors } from '@/hooks';

type SubjectPromptCardProps = {
  lesson: Lesson;
  isGenerating: boolean;
  onGenerateNew: (promptType: PromptLanguageType) => void;
};

export function SubjectPromptCard({ lesson, isGenerating, onGenerateNew }: SubjectPromptCardProps) {
  const colors = useColors();
  const [showMenu, setShowMenu] = useState(false);

  const promptTypeLabel =
    lesson.promptLanguage === 'learning' ? 'Learning Language' : 'Your Language';

  const handleMenuOption = (promptType: PromptLanguageType) => {
    setShowMenu(false);
    onGenerateNew(promptType);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Writing Prompt</Text>
          <View style={[styles.badge, { backgroundColor: colors.primary + '20' }]}>
            <Text style={[styles.badgeText, { color: colors.primary }]}>{promptTypeLabel}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.newPromptButton,
              { backgroundColor: colors.card, opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setShowMenu(!showMenu)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="refresh" size={16} color={colors.primary} />
                <Text style={[styles.newPromptText, { color: colors.primary }]}>New Prompt</Text>
                <Ionicons
                  name={showMenu ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={colors.primary}
                />
              </>
            )}
          </Pressable>

          {showMenu && (
            <View
              style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? colors.background : 'transparent' },
                ]}
                onPress={() => handleMenuOption('user')}
              >
                <Ionicons name="person-outline" size={18} color={colors.text} />
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>Your Language</Text>
                  <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>
                    Prompt in your native language
                  </Text>
                </View>
              </Pressable>

              <View style={[styles.menuDivider, { backgroundColor: colors.border }]} />

              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  { backgroundColor: pressed ? colors.background : 'transparent' },
                ]}
                onPress={() => handleMenuOption('learning')}
              >
                <Ionicons name="school-outline" size={18} color={colors.text} />
                <View style={styles.menuItemContent}>
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                    Learning Language
                  </Text>
                  <Text style={[styles.menuItemDescription, { color: colors.textSecondary }]}>
                    Prompt in the language you're learning, using vocabulary from your set
                  </Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.prompt, { color: colors.text }]}>{lesson.prompt}</Text>

      {lesson.phrases && (
        <View style={[styles.phrasesHint, { backgroundColor: colors.background }]}>
          <Ionicons name="bulb-outline" size={14} color={colors.textSecondary} />
          <Text style={[styles.phrasesHintText, { color: colors.textSecondary }]}>
            Try to use: {lesson.phrases}
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
  },
  header: {
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  menuContainer: {
    position: 'relative',
    zIndex: 10,
  },
  newPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  newPromptText: {
    fontSize: 13,
    fontWeight: '500',
  },
  menu: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    minWidth: 260,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
  },
  menuItemContent: {
    flex: 1,
    gap: 2,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuItemDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
  },
  prompt: {
    fontSize: 16,
    lineHeight: 24,
  },
  phrasesHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  phrasesHintText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
