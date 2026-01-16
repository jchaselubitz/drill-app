import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, LanguageChooser, Select } from '@/components';
import { SkillAnalysisCard, SkillsList } from '@/components/skills';
import { CEFR_LEVELS } from '@/constants';
import { useSettings } from '@/contexts/SettingsContext';
import { useColors, useSkillAnalysis } from '@/hooks';
import type { CEFRLevel, LanguageCode, ThemeMode } from '@/types';

export default function SettingsScreen() {
  const colors = useColors();
  const { settings, updateSettings, isLoading } = useSettings();
  const { skills, isAnalyzing, error, runAnalysis, lastAnalyzedAt, staleDays } = useSkillAnalysis();

  const levelOptions = CEFR_LEVELS.map((level) => ({
    value: level.level,
    label: `${level.level} - ${level.name}`,
  }));

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loading}>
          <Text style={{ color: colors.text }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

          <View style={styles.settingsForm}>
            <Select
              label="Theme"
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
              value={settings.theme}
              onValueChange={(value: ThemeMode) => updateSettings({ theme: value })}
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Language Settings</Text>

          <View style={styles.settingsForm}>
            <LanguageChooser
              label="I speak"
              value={settings.userLanguage}
              onValueChange={(value: LanguageCode) => updateSettings({ userLanguage: value })}
            />

            <LanguageChooser
              label="I'm learning"
              value={settings.topicLanguage}
              onValueChange={(value: LanguageCode) => updateSettings({ topicLanguage: value })}
            />

            <Select
              label="My level"
              options={levelOptions}
              value={settings.level}
              onValueChange={(value: CEFRLevel) => updateSettings({ level: value })}
            />
          </View>
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills to Improve</Text>
          <SkillAnalysisCard
            onAnalyze={runAnalysis}
            isAnalyzing={isAnalyzing}
            error={error}
            lastAnalyzedAt={lastAnalyzedAt}
            staleDays={staleDays}
            skillCount={skills.length}
          />
          <SkillsList skills={skills} />
        </Card>

        <Card>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
          <Text style={[styles.aboutText, { color: colors.textSecondary }]}>
            Drill helps you improve your writing skills in a new language through AI-powered prompts
            and feedback.
          </Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  settingsForm: {
    gap: 16,
    marginTop: 12,
  },
  aboutText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  version: {
    fontSize: 12,
    marginTop: 12,
  },
});
