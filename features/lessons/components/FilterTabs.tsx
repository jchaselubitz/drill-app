import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks';

export type FilterTab = 'topics' | 'lessons' | 'sets';

type FilterTabsProps = {
  activeTab: FilterTab;
  onTabChange: (tab: FilterTab) => void;
};

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'topics', label: 'Topics' },
  { key: 'lessons', label: 'Prompts' },
  { key: 'sets', label: 'Sets' },
];

export function FilterTabs({ activeTab, onTabChange }: FilterTabsProps) {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive && { backgroundColor: colors.primary }]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text style={[styles.tabText, { color: isActive ? '#fff' : colors.textSecondary }]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
