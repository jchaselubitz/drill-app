import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, AppState, Platform } from 'react-native';

const CONSENT_KEY = 'drill.third-party-ai-consent.v1';
export const AI_DISCLOSURE =
  'When you use AI features, Drill sends your writing, phrases, and related study context to OpenRouter and Google for processing. Queued requests can finish in the background. You can turn AI access off in Settings.';
export const AI_PRIVACY_URL = 'https://drillapp.xyz/privacy';
let prompt: Promise<boolean> | undefined;

export async function hasAiConsent(): Promise<boolean> {
  return (await AsyncStorage.getItem(CONSENT_KEY)) === 'allowed';
}

export function setAiConsent(allowed: boolean): Promise<void> {
  return AsyncStorage.setItem(CONSENT_KEY, allowed ? 'allowed' : 'denied');
}

export async function requireAiConsent(): Promise<void> {
  const status = await AsyncStorage.getItem(CONSENT_KEY);
  if (status === 'allowed') return;

  if (status === null && Platform.OS === 'ios' && AppState.currentState === 'active') {
    prompt ??= new Promise<boolean>((resolve) => {
      Alert.alert('Allow third-party AI?', AI_DISCLOSURE, [
        { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Allow', onPress: () => resolve(true) },
      ]);
    })
      .then(async (allowed) => {
        await setAiConsent(allowed);
        return allowed;
      })
      .finally(() => {
        prompt = undefined;
      });
    if (await prompt) return;
  }

  throw new Error('To use AI features, allow third-party AI in Drill’s Settings.');
}
