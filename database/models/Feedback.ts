import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

import { ATTEMPT_TABLE, FEEDBACK_TABLE } from '@/database/schema';

import type Attempt from './Attempt';

export interface FeedbackProps {
  id: string;
  attemptId: string;
  point: string;
  explanation: string;
  negative: boolean;
  createdAt: number;
  updatedAt: number;
}

export default class Feedback extends Model {
  static table = FEEDBACK_TABLE;

  static associations = {
    [ATTEMPT_TABLE]: { type: 'belongs_to' as const, key: 'attempt_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('attempt_id') attemptId!: string;
  @field('point') point!: string;
  @field('explanation') explanation!: string;
  @field('negative') negative!: boolean;

  @relation(ATTEMPT_TABLE, 'attempt_id') attempt!: Relation<Attempt>;
}
