import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';

type Stat = {
  label: string;
  value: number;
  highlight?: boolean;
};

type LessonTypeCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  stats: Stat[];
  onPress: () => void;
};

export function LessonTypeCard({ icon, title, stats, onPress }: LessonTypeCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + '18' }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <Text
              key={stat.label}
              style={[
                styles.stat,
                { color: stat.highlight ? colors.primary : colors.textSecondary },
              ]}
            >
              {stat.value} {stat.label}
            </Text>
          ))}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stat: {
    fontSize: 13,
  },
});
