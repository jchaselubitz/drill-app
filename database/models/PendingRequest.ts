import { Model, Relation } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field, relation } from '@nozbe/watermelondb/decorators';

import { ATTEMPT_TABLE, PENDING_REQUEST_TABLE } from '@/database/schema';
import type { LanguageCode } from '@/types';

import type Attempt from './Attempt';

const MAX_RETRIES = 3;

export interface PendingRequestProps {
  id: string;
  attemptId: string;
  topicLanguage: LanguageCode;
  userLanguage: LanguageCode;
  retryCount: number;
  createdAt: number;
  updatedAt: number;
}

type CreatePendingRequestParams = Omit<PendingRequestProps, 'id' | 'createdAt' | 'updatedAt' | 'retryCount'>;

export default class PendingRequest extends Model {
  static table = PENDING_REQUEST_TABLE;

  static associations = {
    [ATTEMPT_TABLE]: { type: 'belongs_to' as const, key: 'attempt_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('attempt_id') attemptId!: string;
  @field('topic_language') topicLanguage!: LanguageCode;
  @field('user_language') userLanguage!: LanguageCode;
  @field('retry_count') retryCount!: number;

  @relation(ATTEMPT_TABLE, 'attempt_id') attempt!: Relation<Attempt>;

  get canRetry(): boolean {
    return this.retryCount < MAX_RETRIES;
  }

  static async create(
    db: Database,
    { attemptId, topicLanguage, userLanguage }: CreatePendingRequestParams
  ): Promise<PendingRequest> {
    return await db.write(async () => {
      const now = Date.now();
      return await db.collections.get<PendingRequest>(PENDING_REQUEST_TABLE).create((request) => {
        request.attemptId = attemptId;
        request.topicLanguage = topicLanguage;
        request.userLanguage = userLanguage;
        request.retryCount = 0;
        request.createdAt = now;
        request.updatedAt = now;
      });
    });
  }

  async incrementRetry(db: Database): Promise<void> {
    await db.write(async () => {
      await this.update((request) => {
        request.retryCount = this.retryCount + 1;
        request.updatedAt = Date.now();
      });
    });
  }

  async delete(db: Database): Promise<void> {
    await db.write(async () => {
      await this.destroyPermanently();
    });
  }

  static async getAllPending(db: Database): Promise<PendingRequest[]> {
    return await db.collections.get<PendingRequest>(PENDING_REQUEST_TABLE).query().fetch();
  }
}
