import { DEFAULT_SETTINGS } from '@/constants';
import { initializeGemini } from '@/lib/gemini';
import type { UserSettings } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const SETTINGS_KEY = '@drill_settings';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
console.log('GEMINI_KEY', GEMINI_KEY);
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
        const parsed = JSON.parse(stored) as UserSettings;
        setSettings(parsed);
        if (GEMINI_KEY) {
          initializeGemini(GEMINI_KEY);
        } else {
          initializeGemini(parsed.apiKey);
        }
        if (parsed.apiKey) {
          initializeGemini(parsed.apiKey);
        }
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
        if (updates.apiKey) {
          initializeGemini(updates.apiKey);
        }
      } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
      }
    },
    [settings]
  );

  return { settings, updateSettings, isLoading };
}
