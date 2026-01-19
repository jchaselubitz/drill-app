import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useState } from 'react';

import { PendingAudioRequest } from '@/database/models';
import { PENDING_AUDIO_REQUEST_TABLE } from '@/database/schema';

export type DeckAudioStatus = {
  pendingCount: number;
  processingCount: number;
  failedCount: number;
  isGenerating: boolean;
};

export function useDeckAudioStatus(deckId: string | undefined): DeckAudioStatus {
  const db = useDatabase();
  const [status, setStatus] = useState<DeckAudioStatus>({
    pendingCount: 0,
    processingCount: 0,
    failedCount: 0,
    isGenerating: false,
  });

  useEffect(() => {
    if (!deckId) return;

    const subscription = db.collections
      .get<PendingAudioRequest>(PENDING_AUDIO_REQUEST_TABLE)
      .query(Q.where('deck_id', deckId))
      .observe()
      .subscribe((requests) => {
        const pendingCount = requests.filter((r) => r.status === 'pending').length;
        const processingCount = requests.filter((r) => r.status === 'processing').length;
        const failedCount = requests.filter((r) => r.status === 'failed').length;

        setStatus({
          pendingCount,
          processingCount,
          failedCount,
          isGenerating: pendingCount > 0 || processingCount > 0,
        });
      });

    return () => subscription.unsubscribe();
  }, [db, deckId]);

  return status;
}
