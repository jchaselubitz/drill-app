import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { colors, spacing, typography } from '@theme/colors';
import Constants from 'expo-constants';

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Daily reminder</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.background}
        />
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Supabase project URL</Text>
        <Text style={styles.value}>{Constants.expoConfig?.extra?.supabaseUrl ?? 'Not configured'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>AI proxy function</Text>
        <Text style={styles.value}>{Constants.expoConfig?.extra?.openAiProxyUrl ?? 'Not configured'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md
  },
  title: {
    fontSize: typography.header,
    color: colors.textPrimary,
    fontWeight: '700'
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: '600'
  },
  value: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md
  }
});

export default SettingsScreen;
