import { Directory, File, Paths } from 'expo-file-system';

const AUDIO_DIR_NAME = 'audio';

/**
 * Gets the audio directory.
 */
function getAudioDirectory(): Directory {
  return new Directory(Paths.document, AUDIO_DIR_NAME);
}

/**
 * Ensures the audio directory exists.
 */
export async function ensureAudioDirectory(): Promise<void> {
  const audioDir = getAudioDirectory();
  if (!audioDir.exists) {
    await audioDir.create();
  }
}

/**
 * Generates a unique filename for a phrase audio file.
 */
export function generateAudioFilename(phraseId: string): string {
  return `phrase_${phraseId}.mp3`;
}

/**
 * Gets the full path for an audio file.
 */
export function getAudioFilePath(filename: string): string {
  const audioDir = getAudioDirectory();
  return new File(audioDir, filename).uri;
}

/**
 * Saves base64-encoded audio data to a file.
 * Returns the filename (not full path) for storage in the database.
 */
export async function saveAudioFile(phraseId: string, audioBase64: string): Promise<string> {
  await ensureAudioDirectory();

  const filename = generateAudioFilename(phraseId);
  const audioDir = getAudioDirectory();
  const file = new File(audioDir, filename);

  // Convert base64 to bytes and write
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  await file.write(bytes);

  return filename;
}

/**
 * Deletes an audio file if it exists.
 */
export async function deleteAudioFile(filename: string): Promise<void> {
  const audioDir = getAudioDirectory();
  const file = new File(audioDir, filename);

  if (file.exists) {
    await file.delete();
  }
}

/**
 * Checks if an audio file exists.
 */
export function audioFileExists(filename: string): boolean {
  const audioDir = getAudioDirectory();
  const file = new File(audioDir, filename);
  return file.exists;
}

/**
 * Gets the file URI for playback.
 * Strips file:// prefix if present for iOS compatibility with expo-audio.
 */
export function getAudioFileUri(filename: string): string {
  const filePath = getAudioFilePath(filename);
  // Remove file:// prefix if present (iOS compatibility)
  if (filePath.startsWith('file://')) {
    return filePath.replace('file://', '');
  }
  return filePath;
}

/**
 * Checks if an audio file exists and returns the URI if it does.
 * Returns null if the file doesn't exist.
 */
export function getAudioFileUriIfExists(filename: string): string | null {
  const audioDir = getAudioDirectory();
  const file = new File(audioDir, filename);
  if (!file.exists) {
    return null;
  }
  return getAudioFileUri(filename);
}
