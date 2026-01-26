import { Q } from '@nozbe/watermelondb';
import { useDatabase } from '@nozbe/watermelondb/react';
import { useEffect, useState } from 'react';

import { SRS_CARD_TABLE } from '@/database/schema';

export type DeckDueCountResult = {
  dueCount: number;
  isLoading: boolean;
};

export function useDeckDueCount(deckId: string | undefined): DeckDueCountResult {
  const db = useDatabase();
  const [result, setResult] = useState<DeckDueCountResult>({
    dueCount: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!deckId) {
      setResult({ dueCount: 0, isLoading: false });
      return;
    }

    const subscription = db.collections
      .get(SRS_CARD_TABLE)
      .query(Q.where('deck_id', deckId), Q.where('due_at', Q.lte(Date.now())))
      .observeCount()
      .subscribe((count) => {
        setResult({ dueCount: count, isLoading: false });
      });

    return () => subscription.unsubscribe();
  }, [db, deckId]);

  return result;
}
