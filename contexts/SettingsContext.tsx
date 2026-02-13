import { useDatabase } from '@nozbe/watermelondb/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS } from '@/constants';
import Profile from '@/database/models/Profile';
import { PROFILE_TABLE } from '@/database/schema';
import type { CEFRLevel, LanguageCode, UserSettings } from '@/types';

const APP_SETTINGS_KEY = '@drill_app_settings';

type AppSettings = {
  theme: UserSettings['theme'];
  dayStartHour: number;
  autoPlayReviewAudio: boolean;
  activeDeckId: string | null;
  maxNewPerDay: number;
  maxReviewsPerDay: number;
};

const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: DEFAULT_SETTINGS.theme,
  dayStartHour: DEFAULT_SETTINGS.dayStartHour,
  autoPlayReviewAudio: DEFAULT_SETTINGS.autoPlayReviewAudio,
  activeDeckId: DEFAULT_SETTINGS.activeDeckId,
  maxNewPerDay: DEFAULT_SETTINGS.maxNewPerDay,
  maxReviewsPerDay: DEFAULT_SETTINGS.maxReviewsPerDay,
};

type SettingsContextType = {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
  isLoading: boolean;
};

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const database = useDatabase();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  const getOrCreateProfile = useCallback(async (): Promise<Profile> => {
    const profiles = await database.collections.get<Profile>(PROFILE_TABLE).query().fetch();

    if (profiles.length > 0) {
      return profiles[0];
    }

    // Create default profile
    return await database.write(async () => {
      return await database.collections.get<Profile>(PROFILE_TABLE).create((profile) => {
        profile.username = null;
        profile.imageUrl = null;
        profile.userLanguage = DEFAULT_SETTINGS.userLanguage;
        profile.studyLanguage = DEFAULT_SETTINGS.topicLanguage;
        profile.level = DEFAULT_SETTINGS.level;
        profile.createdAt = Date.now();
        profile.updatedAt = Date.now();
      });
    });
  }, [database]);

  const loadSettings = useCallback(async () => {
    try {
      // Load from Profile
      const profile = await getOrCreateProfile();

      // Load app settings from AsyncStorage
      const storedAppSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
      const parsedAppSettings = storedAppSettings ? JSON.parse(storedAppSettings) : {};
      const appSettings: AppSettings = {
        ...DEFAULT_APP_SETTINGS,
        ...parsedAppSettings,
      };

      const mergedSettings: UserSettings = {
        userLanguage: (profile.userLanguage as LanguageCode) || DEFAULT_SETTINGS.userLanguage,
        topicLanguage: (profile.studyLanguage as LanguageCode) || DEFAULT_SETTINGS.topicLanguage,
        level: (profile.level as CEFRLevel) || DEFAULT_SETTINGS.level,
        theme: appSettings.theme,
        dayStartHour: appSettings.dayStartHour,
        autoPlayReviewAudio: appSettings.autoPlayReviewAudio,
        activeDeckId: appSettings.activeDeckId,
        maxNewPerDay: appSettings.maxNewPerDay,
        maxReviewsPerDay: appSettings.maxReviewsPerDay,
      };

      setSettings(mergedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getOrCreateProfile]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const refreshSettings = useCallback(async () => {
    await loadSettings();
  }, [loadSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<UserSettings>) => {
      try {
        const newSettings = { ...settings, ...updates };

        // Update Profile fields
        if (
          updates.userLanguage !== undefined ||
          updates.topicLanguage !== undefined ||
          updates.level !== undefined
        ) {
          const profile = await getOrCreateProfile();
          await database.write(async () => {
            await profile.update((p) => {
              if (updates.userLanguage !== undefined) {
                p.userLanguage = updates.userLanguage;
              }
              if (updates.topicLanguage !== undefined) {
                p.studyLanguage = updates.topicLanguage;
              }
              if (updates.level !== undefined) {
                p.level = updates.level;
              }
              p.updatedAt = Date.now();
            });
          });
        }

        // Update app settings in AsyncStorage
        if (
          updates.theme !== undefined ||
          updates.dayStartHour !== undefined ||
          updates.autoPlayReviewAudio !== undefined ||
          updates.activeDeckId !== undefined ||
          updates.maxNewPerDay !== undefined ||
          updates.maxReviewsPerDay !== undefined
        ) {
          const storedAppSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
          const parsedAppSettings = storedAppSettings ? JSON.parse(storedAppSettings) : {};
          const appSettings: AppSettings = {
            ...DEFAULT_APP_SETTINGS,
            ...parsedAppSettings,
          };

          const newAppSettings: AppSettings = {
            ...appSettings,
            ...(updates.theme !== undefined && { theme: updates.theme }),
            ...(updates.dayStartHour !== undefined && { dayStartHour: updates.dayStartHour }),
            ...(updates.autoPlayReviewAudio !== undefined && {
              autoPlayReviewAudio: updates.autoPlayReviewAudio,
            }),
            ...(updates.activeDeckId !== undefined && { activeDeckId: updates.activeDeckId }),
            ...(updates.maxNewPerDay !== undefined && { maxNewPerDay: updates.maxNewPerDay }),
            ...(updates.maxReviewsPerDay !== undefined && {
              maxReviewsPerDay: updates.maxReviewsPerDay,
            }),
          };

          await AsyncStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(newAppSettings));
        }

        setSettings(newSettings);
      } catch (error) {
        console.error('Failed to save settings:', error);
        throw error;
      }
    },
    [settings, database, getOrCreateProfile]
  );

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, refreshSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
