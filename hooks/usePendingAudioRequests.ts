import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { retryPendingAudioRequests } from '@/lib/backgroundAudioService';
import { registerAudioBackgroundFetch } from '@/lib/backgroundTasks';

/**
 * Hook that retries pending audio requests when the app comes to foreground.
 * Also registers background fetch for periodic retries.
 * Should be used at the app root level.
 */
export function usePendingAudioRequests(): void {
  const db = useDatabase();
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Register background fetch task (iOS and Android only)
    if (Platform.OS !== 'web') {
      registerAudioBackgroundFetch();
    }

    // Retry pending requests on mount
    retryPendingAudioRequests(db);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // When app comes to foreground from background
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        retryPendingAudioRequests(db);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [db]);
}
