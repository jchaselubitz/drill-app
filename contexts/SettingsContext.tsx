import { useDatabase } from '@nozbe/watermelondb/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { DEFAULT_SETTINGS } from '@/constants';
import Deck from '@/database/models/Deck';
import Profile from '@/database/models/Profile';
import { DECK_TABLE, PROFILE_TABLE } from '@/database/schema';
import type { CEFRLevel, LanguageCode, UserSettings } from '@/types';

const APP_SETTINGS_KEY = '@drill_app_settings';

type AppSettings = {
  theme: UserSettings['theme'];
  dayStartHour: number;
  autoPlayReviewAudio: boolean;
  activeDeckId: string | null;
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
      const appSettings: AppSettings = storedAppSettings
        ? JSON.parse(storedAppSettings)
        : {
            theme: DEFAULT_SETTINGS.theme,
            dayStartHour: DEFAULT_SETTINGS.dayStartHour,
            autoPlayReviewAudio: DEFAULT_SETTINGS.autoPlayReviewAudio,
            activeDeckId: DEFAULT_SETTINGS.activeDeckId,
          };

      // Load deck settings
      let activeDeck: Deck | null = null;
      if (appSettings.activeDeckId) {
        try {
          activeDeck = await database.collections
            .get<Deck>(DECK_TABLE)
            .find(appSettings.activeDeckId);
        } catch {
          // Deck not found, will use defaults
        }
      }

      // If no active deck, try to get the default deck
      if (!activeDeck) {
        activeDeck = await Deck.getDefault(database);
      }

      const mergedSettings: UserSettings = {
        userLanguage: (profile.userLanguage as LanguageCode) || DEFAULT_SETTINGS.userLanguage,
        topicLanguage: (profile.studyLanguage as LanguageCode) || DEFAULT_SETTINGS.topicLanguage,
        level: (profile.level as CEFRLevel) || DEFAULT_SETTINGS.level,
        theme: appSettings.theme,
        dayStartHour: appSettings.dayStartHour,
        autoPlayReviewAudio: appSettings.autoPlayReviewAudio,
        activeDeckId: appSettings.activeDeckId,
        maxNewPerDay: activeDeck?.maxNewPerDay ?? DEFAULT_SETTINGS.maxNewPerDay,
        maxReviewsPerDay: activeDeck?.maxReviewsPerDay ?? DEFAULT_SETTINGS.maxReviewsPerDay,
      };

      setSettings(mergedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [database, getOrCreateProfile]);

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

        // Update Deck fields
        if (updates.maxNewPerDay !== undefined || updates.maxReviewsPerDay !== undefined) {
          let activeDeck: Deck | null = null;

          if (settings.activeDeckId) {
            try {
              activeDeck = await database.collections
                .get<Deck>(DECK_TABLE)
                .find(settings.activeDeckId);
            } catch {
              // Deck not found
            }
          }

          if (!activeDeck) {
            activeDeck = await Deck.getOrCreateDefault(database);
          }

          await database.write(async () => {
            await activeDeck!.update((deck) => {
              if (updates.maxNewPerDay !== undefined) {
                deck.maxNewPerDay = updates.maxNewPerDay;
              }
              if (updates.maxReviewsPerDay !== undefined) {
                deck.maxReviewsPerDay = updates.maxReviewsPerDay;
              }
              deck.updatedAt = Date.now();
            });
          });
        }

        // Update app settings in AsyncStorage
        if (
          updates.theme !== undefined ||
          updates.dayStartHour !== undefined ||
          updates.autoPlayReviewAudio !== undefined ||
          updates.activeDeckId !== undefined
        ) {
          const storedAppSettings = await AsyncStorage.getItem(APP_SETTINGS_KEY);
          const appSettings: AppSettings = storedAppSettings
            ? JSON.parse(storedAppSettings)
            : {
                theme: DEFAULT_SETTINGS.theme,
                dayStartHour: DEFAULT_SETTINGS.dayStartHour,
                autoPlayReviewAudio: DEFAULT_SETTINGS.autoPlayReviewAudio,
                activeDeckId: DEFAULT_SETTINGS.activeDeckId,
              };

          const newAppSettings: AppSettings = {
            ...appSettings,
            ...(updates.theme !== undefined && { theme: updates.theme }),
            ...(updates.dayStartHour !== undefined && { dayStartHour: updates.dayStartHour }),
            ...(updates.autoPlayReviewAudio !== undefined && {
              autoPlayReviewAudio: updates.autoPlayReviewAudio,
            }),
            ...(updates.activeDeckId !== undefined && { activeDeckId: updates.activeDeckId }),
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
