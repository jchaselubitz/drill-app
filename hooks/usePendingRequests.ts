import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { retryPendingRequests } from '@/lib/backgroundReviewService';
import { registerBackgroundFetch } from '@/lib/backgroundTasks';

/**
 * Hook that retries pending review requests when the app comes to foreground.
 * Also registers background fetch for periodic retries.
 * Should be used at the app root level.
 */
export function usePendingRequests(): void {
  const db = useDatabase();
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    // Register background fetch task (iOS and Android only)
    if (Platform.OS !== 'web') {
      registerBackgroundFetch();
    }

    // Retry pending requests on mount
    retryPendingRequests(db);

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // When app comes to foreground from background
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        retryPendingRequests(db);
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [db]);
}
