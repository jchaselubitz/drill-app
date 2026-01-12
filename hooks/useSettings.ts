import { DEFAULT_SETTINGS } from '@/constants';
import { initializeGemini } from '@/lib/gemini';
import type { UserSettings } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';

const SETTINGS_KEY = '@drill_settings';
const geminiApiKey = Constants.expoConfig?.extra?.geminiApiKey as string | undefined;

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserSettings>;
        // Merge with defaults to ensure all fields are present (for migrations)
        const mergedSettings = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(mergedSettings);
        // Save merged settings back if there were missing fields
        if (Object.keys(parsed).length < Object.keys(DEFAULT_SETTINGS).length) {
          await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(mergedSettings));
        }
      }

      if (geminiApiKey) {
        initializeGemini(geminiApiKey);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      try {
        const newSettings = { ...settings, ...updates };
        await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
      } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
      }
    },
    [settings]
  );

  return { settings, updateSettings, isLoading };
}
