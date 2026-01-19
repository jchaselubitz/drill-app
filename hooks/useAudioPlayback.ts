import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getAudioFileUriIfExists } from '@/lib/audio/storage';

export type AudioPlaybackState = 'idle' | 'loading' | 'playing' | 'paused';

export function useAudioPlayback() {
  const [currentUri, setCurrentUri] = useState<string | null>(null);
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>('idle');
  const previousIsLoadedRef = useRef(false);
  const shouldAutoPlayRef = useRef(false);

  const player = useAudioPlayer(currentUri ?? undefined);
  const status = useAudioPlayerStatus(player);

  // Auto-play when audio finishes loading
  useEffect(() => {
    if (
      currentUri &&
      !previousIsLoadedRef.current &&
      status.isLoaded &&
      shouldAutoPlayRef.current
    ) {
      // Audio just finished loading, start playing
      player.seekTo(0);
      player.play();
      shouldAutoPlayRef.current = false;
    }
    previousIsLoadedRef.current = status.isLoaded;
  }, [currentUri, status.isLoaded, player]);

  // Sync playback state with player status
  useEffect(() => {
    if (!currentUri) {
      setPlaybackState('idle');
      return;
    }

    if (!status.isLoaded) {
      setPlaybackState('loading');
    } else if (status.playing) {
      setPlaybackState('playing');
    } else {
      setPlaybackState('paused');
    }
  }, [currentUri, status.isLoaded, status.playing]);

  // Handle playback errors
  useEffect(() => {
    if (status.error) {
      console.error('Audio playback error:', status.error);
      setPlaybackState('idle');
      setCurrentUri(null);
    }
  }, [status.error]);

  // Reset to idle when playback finishes
  useEffect(() => {
    if (status.isLoaded && status.currentTime >= status.duration && status.duration > 0) {
      setPlaybackState('idle');
      setCurrentUri(null);
    }
  }, [status.isLoaded, status.currentTime, status.duration]);

  const play = useCallback(
    (filename: string) => {
      // Verify file exists before attempting playback
      const uri = getAudioFileUriIfExists(filename);
      if (!uri) {
        console.warn(`Audio file not found: ${filename}`);
        return;
      }

      if (currentUri === uri && status.isLoaded) {
        // Same audio, just play/resume
        player.seekTo(0);
        player.play();
      } else {
        // Different audio, load new source
        shouldAutoPlayRef.current = true;
        previousIsLoadedRef.current = false;
        setCurrentUri(uri);
        // Auto-play will happen when audio loads (see useEffect above)
      }
    },
    [currentUri, status.isLoaded, player]
  );

  const pause = useCallback(() => {
    if (status.isLoaded && status.playing) {
      player.pause();
    }
  }, [player, status.isLoaded, status.playing]);

  const stop = useCallback(() => {
    if (status.isLoaded) {
      player.pause();
      player.seekTo(0);
    }
    setCurrentUri(null);
    setPlaybackState('idle');
  }, [player, status.isLoaded]);

  const togglePlayPause = useCallback(
    (filename: string) => {
      // Verify file exists before attempting playback
      const uri = getAudioFileUriIfExists(filename);
      if (!uri) {
        console.warn(`Audio file not found: ${filename}`);
        return;
      }

      if (currentUri === uri && status.playing) {
        pause();
      } else {
        play(filename);
      }
    },
    [currentUri, status.playing, play, pause]
  );

  const isPlayingFile = useCallback(
    (filename: string) => {
      const uri = getAudioFileUriIfExists(filename);
      if (!uri) {
        return false;
      }
      return currentUri === uri && status.playing;
    },
    [currentUri, status.playing]
  );

  return {
    play,
    pause,
    stop,
    togglePlayPause,
    isPlayingFile,
    playbackState,
    currentUri,
  };
}
