import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

import database from '@/database';

import { retryPendingRequests } from './backgroundReviewService';

const BACKGROUND_FETCH_TASK = 'background-review-fetch';

// Define the background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await retryPendingRequests(database);
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('Background fetch failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/**
 * Registers the background fetch task.
 * Call this once during app initialization.
 */
export async function registerBackgroundFetch(): Promise<void> {
  try {
    await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15, // 15 minutes (minimum allowed)
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
    await BackgroundTask.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
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
