import { StyleSheet, Text, View } from 'react-native';

import type Skill from '@/database/models/Skill';
import { useColors } from '@/hooks';

import { SkillItem } from './SkillItem';

type SkillsListProps = {
  skills: Skill[];
};

export function SkillsList({ skills }: SkillsListProps) {
  const colors = useColors();

  if (skills.length === 0) {
    return null;
  }

  const activeSkills = skills.filter((s) => s.status === 'active');
  const improvingSkills = skills.filter((s) => s.status === 'improving');
  const resolvedSkills = skills.filter((s) => s.status === 'resolved');

  return (
    <View style={styles.container}>
      {activeSkills.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Active</Text>
          {activeSkills.map((skill) => (
            <SkillItem
              key={skill.id}
              name={skill.name}
              category={skill.category}
              rank={skill.rank}
              description={skill.description}
              occurrenceCount={skill.occurrenceCount}
              status={skill.status}
            />
          ))}
        </View>
      )}

      {improvingSkills.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Improving</Text>
          {improvingSkills.map((skill) => (
            <SkillItem
              key={skill.id}
              name={skill.name}
              category={skill.category}
              rank={skill.rank}
              description={skill.description}
              occurrenceCount={skill.occurrenceCount}
              status={skill.status}
            />
          ))}
        </View>
      )}

      {resolvedSkills.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Resolved</Text>
          {resolvedSkills.map((skill) => (
            <SkillItem
              key={skill.id}
              name={skill.name}
              category={skill.category}
              rank={skill.rank}
              description={skill.description}
              occurrenceCount={skill.occurrenceCount}
              status={skill.status}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  section: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
    marginLeft: 4,
  },
});
