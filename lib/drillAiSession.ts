import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const drillAiUrl = Constants.expoConfig?.extra?.drillAiUrl as string | undefined;
const KEY_ID_STORAGE = 'drill.app-attest-key.v1';

type Session = { token: string; expiresAt: number };
let currentSession: Session | undefined;
let pendingSession: Promise<Session> | undefined;

async function attestRequest<T>(endpoint: string, body: object): Promise<T> {
  if (!drillAiUrl) throw new Error('Drill’s AI service is unavailable.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${drillAiUrl}/v1/attest/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok)
      throw new Error('Drill could not verify this installation. Please try again.');
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

async function createSession(allowKeyReset = true): Promise<Session> {
  if (Platform.OS !== 'ios') throw new Error('Drill’s hosted AI is available on iPhone and iPad.');
  const integrity = await import('@expo/app-integrity');
  if (!integrity.isSupported) throw new Error('Drill could not verify this device for hosted AI.');

  let keyId = await AsyncStorage.getItem(KEY_ID_STORAGE);
  if (!keyId) {
    keyId = await integrity.generateKeyAsync();
    await AsyncStorage.setItem(KEY_ID_STORAGE, keyId);
  }
  const { challenge, mode } = await attestRequest<{
    challenge: string;
    mode: 'attestation' | 'assertion';
  }>('challenge', { keyId });
  let proof: string;
  try {
    proof =
      mode === 'attestation'
        ? await integrity.attestKeyAsync(keyId, challenge)
        : await integrity.generateAssertionAsync(keyId, challenge);
  } catch (error) {
    if (
      !allowKeyReset ||
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'ERR_APP_INTEGRITY_INVALID_KEY'
    ) {
      throw error;
    }
    await AsyncStorage.removeItem(KEY_ID_STORAGE);
    return createSession(false);
  }
  const { token, expiresInSeconds } = await attestRequest<{
    token: string;
    expiresInSeconds: number;
  }>('verify', { keyId, challenge, proof });
  return { token, expiresAt: Date.now() + expiresInSeconds * 1000 };
}

export async function getDrillAiToken(): Promise<string> {
  if (currentSession && currentSession.expiresAt > Date.now() + 30_000) {
    return currentSession.token;
  }
  pendingSession ??= createSession()
    .then((session) => {
      currentSession = session;
      return session;
    })
    .finally(() => {
      pendingSession = undefined;
    });
  return (await pendingSession).token;
}

export function forgetDrillAiToken(token: string): void {
  if (currentSession?.token === token) currentSession = undefined;
}
