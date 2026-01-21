import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, Text, UIManager, View } from 'react-native';

import { useColors } from '@/hooks';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CollapsibleSectionProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  defaultExpanded?: boolean;
  preview?: string;
};

export function CollapsibleSection({
  title,
  icon,
  children,
  defaultExpanded = false,
  preview,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = useColors();

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable style={styles.header} onPress={toggleExpanded}>
        <View style={styles.headerLeft}>
          {icon && <Ionicons name={icon} size={18} color={colors.textSecondary} />}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {!isExpanded && preview && (
            <Text
              style={[styles.preview, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {preview}
            </Text>
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>
      {isExpanded && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  preview: {
    fontSize: 13,
    maxWidth: 150,
  },
  content: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});
