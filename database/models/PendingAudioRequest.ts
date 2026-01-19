import { Model, Q } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field } from '@nozbe/watermelondb/decorators';

import { PENDING_AUDIO_REQUEST_TABLE, PHRASE_TABLE } from '@/database/schema';
import type { LanguageCode } from '@/types';

const MAX_RETRIES = 3;

export type AudioRequestStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface PendingAudioRequestProps {
  id: string;
  phraseId: string;
  deckId: string;
  languageCode: LanguageCode;
  status: AudioRequestStatus;
  retryCount: number;
  errorMessage: string | null;
  createdAt: number;
  updatedAt: number;
}

type CreateParams = Pick<PendingAudioRequestProps, 'phraseId' | 'deckId' | 'languageCode'>;

export default class PendingAudioRequest extends Model {
  static table = PENDING_AUDIO_REQUEST_TABLE;

  static associations = {
    [PHRASE_TABLE]: { type: 'belongs_to' as const, key: 'phrase_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('phrase_id') phraseId!: string;
  @field('deck_id') deckId!: string;
  @field('language_code') languageCode!: LanguageCode;
  @field('status') status!: AudioRequestStatus;
  @field('retry_count') retryCount!: number;
  @field('error_message') errorMessage!: string | null;

  get canRetry(): boolean {
    return this.retryCount < MAX_RETRIES;
  }

  static async create(db: Database, params: CreateParams): Promise<PendingAudioRequest> {
    return await db.write(async () => {
      const now = Date.now();
      return await db.collections
        .get<PendingAudioRequest>(PENDING_AUDIO_REQUEST_TABLE)
        .create((request) => {
          request.phraseId = params.phraseId;
          request.deckId = params.deckId;
          request.languageCode = params.languageCode;
          request.status = 'pending';
          request.retryCount = 0;
          request.errorMessage = null;
          request.createdAt = now;
          request.updatedAt = now;
        });
    });
  }

  async markProcessing(db: Database): Promise<void> {
    await db.write(async () => {
      await this.update((request) => {
        request.status = 'processing';
        request.updatedAt = Date.now();
      });
    });
  }

  async markCompleted(db: Database): Promise<void> {
    await db.write(async () => {
      await this.update((request) => {
        request.status = 'completed';
        request.updatedAt = Date.now();
      });
    });
  }

  async markFailed(db: Database, errorMessage: string): Promise<void> {
    await db.write(async () => {
      await this.update((request) => {
        request.status = 'failed';
        request.errorMessage = errorMessage;
        request.updatedAt = Date.now();
      });
    });
  }

  async incrementRetry(db: Database): Promise<void> {
    await db.write(async () => {
      await this.update((request) => {
        request.retryCount = this.retryCount + 1;
        request.status = 'pending';
        request.updatedAt = Date.now();
      });
    });
  }

  async delete(db: Database): Promise<void> {
    await db.write(async () => {
      await this.destroyPermanently();
    });
  }

  static async getAllPending(db: Database): Promise<PendingAudioRequest[]> {
    return await db.collections
      .get<PendingAudioRequest>(PENDING_AUDIO_REQUEST_TABLE)
      .query(Q.where('status', 'pending'))
      .fetch();
  }

  static async getByDeckId(db: Database, deckId: string): Promise<PendingAudioRequest[]> {
    return await db.collections
      .get<PendingAudioRequest>(PENDING_AUDIO_REQUEST_TABLE)
      .query(Q.where('deck_id', deckId))
      .fetch();
  }

  static async getPendingCountForDeck(db: Database, deckId: string): Promise<number> {
    return await db.collections
      .get<PendingAudioRequest>(PENDING_AUDIO_REQUEST_TABLE)
      .query(Q.where('deck_id', deckId), Q.where('status', Q.oneOf(['pending', 'processing'])))
      .fetchCount();
  }

  static async findByPhraseId(db: Database, phraseId: string): Promise<PendingAudioRequest | null> {
    const results = await db.collections
      .get<PendingAudioRequest>(PENDING_AUDIO_REQUEST_TABLE)
      .query(Q.where('phrase_id', phraseId), Q.where('status', Q.oneOf(['pending', 'processing'])))
      .fetch();
    return results[0] ?? null;
  }
}
