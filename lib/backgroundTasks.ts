import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

import database from '@/database';

import { retryPendingRequests } from './backgroundReviewService';

const BACKGROUND_FETCH_TASK = 'background-review-fetch';

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await retryPendingRequests(database);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Registers the background fetch task.
 * Call this once during app initialization.
 */
export async function registerBackgroundFetch(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes (minimum on iOS)
      stopOnTerminate: false,
      startOnBoot: true,
    });
    console.log('Background fetch task registered');
  } catch (error) {
    console.error('Failed to register background fetch:', error);
  }
}

/**
 * Unregisters the background fetch task.
 */
export async function unregisterBackgroundFetch(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    console.log('Background fetch task unregistered');
  } catch (error) {
    console.error('Failed to unregister background fetch:', error);
  }
}

/**
 * Checks if the background fetch task is registered.
 */
export async function isBackgroundFetchRegistered(): Promise<boolean> {
  return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
}
