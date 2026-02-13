import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, LanguageChooser, Select } from '@/components';
import { SkillAnalysisCard, SkillsList } from '@/components/skills';
import { CEFR_LEVELS } from '@/constants';
import { useSettings } from '@/contexts/SettingsContext';
import { useColors, useSkillAnalysis } from '@/hooks';
import type { CEFRLevel, LanguageCode, ThemeMode } from '@/types';

export default function SettingsScreen() {
  const colors = useColors();
  const { settings, updateSettings, refreshSettings, isLoading } = useSettings();
  const { skills, isAnalyzing, error, runAnalysis, lastAnalyzedAt, staleDays } = useSkillAnalysis();

  useFocusEffect(
    useCallback(() => {
      refreshSettings();
    }, [refreshSettings])
  );

  const levelOptions = CEFR_LEVELS.map((level) => ({
    value: level.level,
    label: `${level.level} - ${level.name}`,
  }));

  const maxNewOptions = [5, 10, 20, 30, 50].map((value) => ({
    value: String(value),
    label: `${value} per day`,
  }));

  const maxReviewOptions = [25, 50, 100, 150, 200].map((value) => ({
    value: String(value),
    label: `${value} per day`,
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
      edges={['bottom', 'top']}
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Spaced Repetition</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
            These are default limits for decks that do not have custom flashcard settings.
          </Text>
          <View style={styles.settingsForm}>
            <Select
              label="Default new cards per day"
              options={maxNewOptions}
              value={String(settings.maxNewPerDay)}
              onValueChange={(value: string) => updateSettings({ maxNewPerDay: Number(value) })}
            />

            <Select
              label="Default reviews per day"
              options={maxReviewOptions}
              value={String(settings.maxReviewsPerDay)}
              onValueChange={(value: string) => updateSettings({ maxReviewsPerDay: Number(value) })}
            />

            <View style={styles.settingRow}>
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Auto-play review audio
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Play audio automatically when a phrase appears.
                </Text>
              </View>
              <Switch
                value={settings.autoPlayReviewAudio}
                onValueChange={(value) => updateSettings({ autoPlayReviewAudio: value })}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
                ios_backgroundColor={colors.border}
              />
            </View>
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
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            Version {Constants.expoConfig?.extra?.version as string}
          </Text>
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingText: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 13,
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
