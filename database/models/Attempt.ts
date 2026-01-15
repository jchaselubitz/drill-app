import { Model, Query, Relation } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { children, field, relation } from '@nozbe/watermelondb/decorators';

import { ATTEMPT_TABLE, FEEDBACK_TABLE, LESSON_TABLE } from '@/database/schema';
import type { ReviewResponse } from '@/types';

import { validateFeedback } from './utils/validateFeedback';
import type Feedback from './Feedback';
import type Lesson from './Lesson';

export interface AttemptProps {
  id: string;
  lessonId: string;
  paragraph: string;
  correction: string;
  createdAt: number;
  updatedAt: number;
}

type CreateAttemptParams = Omit<AttemptProps, 'id' | 'createdAt' | 'updatedAt'> & {
  feedback: ReviewResponse['feedback'];
};

export default class Attempt extends Model {
  static table = ATTEMPT_TABLE;

  static associations = {
    [LESSON_TABLE]: { type: 'belongs_to' as const, key: 'lesson_id' },
    [FEEDBACK_TABLE]: { type: 'has_many' as const, foreignKey: 'attempt_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('lesson_id') lessonId!: string;
  @field('paragraph') paragraph!: string;
  @field('correction') correction!: string;

  @relation(LESSON_TABLE, 'lesson_id') lesson!: Relation<Lesson>;
  @children(FEEDBACK_TABLE) feedbackItems!: Query<Feedback>;

  static async addAttempt(
    db: Database,
    { lessonId, paragraph, correction, feedback }: CreateAttemptParams
  ): Promise<Attempt> {
    return await db.write(async () => {
      const now = Date.now();
      const attempt = await db.collections.get<Attempt>(ATTEMPT_TABLE).create((attempt) => {
        attempt.lessonId = lessonId;
        attempt.paragraph = paragraph;
        attempt.correction = correction;
        attempt.createdAt = now;
        attempt.updatedAt = now;
      });

      const validatedFeedback = validateFeedback(feedback);
      const feedbackCollection = db.collections.get<Feedback>(FEEDBACK_TABLE);

      await Promise.all(
        validatedFeedback.map((item) =>
          feedbackCollection.create((feedbackItem) => {
            feedbackItem.attemptId = attempt.id;
            feedbackItem.point = item.point;
            feedbackItem.explanation = item.explanation;
            feedbackItem.negative = item.negative;
            feedbackItem.createdAt = now;
            feedbackItem.updatedAt = now;
          })
        )
      );

      return attempt;
    });
  }
}
