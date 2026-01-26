import { useColorScheme as useRNColorScheme } from 'react-native';

import { Colors } from '@/constants';
import { useSettings } from '@/contexts/SettingsContext';

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme() ?? 'light';
  const { settings } = useSettings();

  if (settings.theme === 'system') {
    return systemColorScheme;
  }
  return settings.theme;
}

export function useColors() {
  const colorScheme = useColorScheme();
  return Colors[colorScheme as keyof typeof Colors];
}
