import { Model, Relation } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field, relation } from '@nozbe/watermelondb/decorators';

import { ATTEMPT_TABLE, LESSON_TABLE } from '@/database/schema';

import type Lesson from './Lesson';

export interface AttemptProps {
  id: string;
  lessonId: string;
  paragraph: string;
  correction: string;
  feedback: string;
  createdAt: number;
  updatedAt: number;
}

export default class Attempt extends Model {
  static table = ATTEMPT_TABLE;

  static associations = {
    [LESSON_TABLE]: { type: 'belongs_to' as const, key: 'lesson_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('lesson_id') lessonId!: string;
  @field('paragraph') paragraph!: string;
  @field('correction') correction!: string;
  @field('feedback') feedback!: string;

  @relation(LESSON_TABLE, 'lesson_id') lesson!: Relation<Lesson>;

  static async addAttempt(
    db: Database,
    {
      lessonId,
      paragraph,
      correction,
      feedback,
    }: Omit<AttemptProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Attempt> {
    return await db.write(async () => {
      return await db.collections.get<Attempt>(ATTEMPT_TABLE).create((attempt) => {
        attempt.lessonId = lessonId;
        attempt.paragraph = paragraph;
        attempt.correction = correction;
        attempt.feedback = feedback;
        attempt.createdAt = Date.now();
        attempt.updatedAt = Date.now();
      });
    });
  }
}
