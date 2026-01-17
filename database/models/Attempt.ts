import { Model, Query, Relation } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { children, field, relation } from '@nozbe/watermelondb/decorators';

import { ATTEMPT_TABLE, FEEDBACK_TABLE, LESSON_TABLE, PHRASE_TABLE } from '@/database/schema';
import type { ReviewResponse } from '@/types';

import { validateFeedback } from './utils/validateFeedback';
import type Feedback from './Feedback';
import type Lesson from './Lesson';
import Phrase from './Phrase';
import Translation from './Translation';

export type AttemptStatus = 'pending' | 'completed' | 'failed';

export interface AttemptProps {
  id: string;
  lessonId: string;
  paragraph: string;
  correction: string;
  status: AttemptStatus;
  createdAt: number;
  updatedAt: number;
}

type CreateAttemptParams = Omit<AttemptProps, 'id' | 'createdAt' | 'updatedAt' | 'status'> & {
  feedback: ReviewResponse['feedback'];
  vocabulary?: ReviewResponse['vocabulary'];
  status?: AttemptStatus;
};

type CreatePendingAttemptParams = {
  lessonId: string;
  paragraph: string;
};

export default class Attempt extends Model {
  static table = ATTEMPT_TABLE;

  static associations = {
    [LESSON_TABLE]: { type: 'belongs_to' as const, key: 'lesson_id' },
    [FEEDBACK_TABLE]: { type: 'has_many' as const, foreignKey: 'attempt_id' },
    [PHRASE_TABLE]: { type: 'has_many' as const, foreignKey: 'attempt_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('lesson_id') lessonId!: string;
  @field('paragraph') paragraph!: string;
  @field('correction') correction!: string;
  @field('status') status!: AttemptStatus;

  @relation(LESSON_TABLE, 'lesson_id') lesson!: Relation<Lesson>;
  @children(FEEDBACK_TABLE) feedbackItems!: Query<Feedback>;
  @children(PHRASE_TABLE) phrases!: Query<Phrase>;

  get isPending(): boolean {
    return this.status === 'pending';
  }

  get isCompleted(): boolean {
    return this.status === 'completed';
  }

  get isFailed(): boolean {
    return this.status === 'failed';
  }

  /**
   * Creates a pending attempt that will be completed when the review comes back.
   */
  static async createPendingAttempt(
    db: Database,
    { lessonId, paragraph }: CreatePendingAttemptParams
  ): Promise<Attempt> {
    return await db.write(async () => {
      const now = Date.now();
      return await db.collections.get<Attempt>(ATTEMPT_TABLE).create((attempt) => {
        attempt.lessonId = lessonId;
        attempt.paragraph = paragraph;
        attempt.correction = '';
        attempt.status = 'pending';
        attempt.createdAt = now;
        attempt.updatedAt = now;
      });
    });
  }

  /**
   * Completes a pending attempt with the review response.
   */
  async completeWithReview(
    db: Database,
    { correction, feedback, vocabulary }: Omit<CreateAttemptParams, 'lessonId' | 'paragraph'>
  ): Promise<void> {
    await db.write(async () => {
      const now = Date.now();

      await this.update((attempt) => {
        attempt.correction = correction;
        attempt.status = 'completed';
        attempt.updatedAt = now;
      });

      const validatedFeedback = validateFeedback(feedback);
      const feedbackCollection = db.collections.get<Feedback>(FEEDBACK_TABLE);

      await Promise.all(
        validatedFeedback.map((item) =>
          feedbackCollection.create((feedbackItem) => {
            feedbackItem.attemptId = this.id;
            feedbackItem.point = item.point;
            feedbackItem.explanation = item.explanation;
            feedbackItem.negative = item.negative;
            feedbackItem.createdAt = now;
            feedbackItem.updatedAt = now;
          })
        )
      );

      if (vocabulary && vocabulary.length > 0) {
        const phraseCollection = db.collections.get<Phrase>(PHRASE_TABLE);
        const translationCollection = db.collections.get<Translation>(Translation.table);

        await Promise.all(
          vocabulary.map(async (vocabItem) => {
            const nativeText = vocabItem.nativeText.trim();
            const targetText = vocabItem.targetText.trim();

            const existingNative = await Phrase.findByUniqueFields(db, {
              text: nativeText,
              lang: vocabItem.nativeLang,
              partSpeech: null,
            });

            const nativePhrase =
              existingNative ??
              (await phraseCollection.create((phrase) => {
                phrase.text = nativeText;
                phrase.lang = vocabItem.nativeLang;
                phrase.source = 'tutor';
                phrase.partSpeech = null;
                phrase.favorite = false;
                phrase.filename = null;
                phrase.type = nativeText.includes(' ') ? 'phrase' : 'word';
                phrase.note = null;
                phrase.difficulty = null;
                phrase.historyId = null;
                phrase.attemptId = this.id;
                phrase.createdAt = now;
                phrase.updatedAt = now;
              }));

            const existingTarget = await Phrase.findByUniqueFields(db, {
              text: targetText,
              lang: vocabItem.targetLang,
              partSpeech: null,
            });

            const targetPhrase =
              existingTarget ??
              (await phraseCollection.create((phrase) => {
                phrase.text = targetText;
                phrase.lang = vocabItem.targetLang;
                phrase.source = 'tutor';
                phrase.partSpeech = null;
                phrase.favorite = false;
                phrase.filename = null;
                phrase.type = targetText.includes(' ') ? 'phrase' : 'word';
                phrase.note = null;
                phrase.difficulty = null;
                phrase.historyId = null;
                phrase.attemptId = this.id;
                phrase.createdAt = now;
                phrase.updatedAt = now;
              }));

            await translationCollection.create((translation) => {
              translation.phrasePrimaryId = nativePhrase.id;
              translation.phraseSecondaryId = targetPhrase.id;
              translation.lessonId = this.lessonId;
              translation.createdAt = now;
              translation.updatedAt = now;
            });
          })
        );
      }
    });
  }

  /**
   * Marks a pending attempt as failed.
   */
  async markFailed(db: Database): Promise<void> {
    await db.write(async () => {
      await this.update((attempt) => {
        attempt.status = 'failed';
        attempt.updatedAt = Date.now();
      });
    });
  }

  static async addAttempt(
    db: Database,
    { lessonId, paragraph, correction, feedback, vocabulary, status = 'completed' }: CreateAttemptParams
  ): Promise<Attempt> {
    return await db.write(async () => {
      const now = Date.now();
      const attempt = await db.collections.get<Attempt>(ATTEMPT_TABLE).create((attempt) => {
        attempt.lessonId = lessonId;
        attempt.paragraph = paragraph;
        attempt.correction = correction;
        attempt.status = status;
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

      // Create phrases and translations from vocabulary if provided
      if (vocabulary && vocabulary.length > 0) {
        const phraseCollection = db.collections.get<Phrase>(PHRASE_TABLE);
        const translationCollection = db.collections.get<Translation>(Translation.table);

        await Promise.all(
          vocabulary.map(async (vocabItem) => {
            const nativeText = vocabItem.nativeText.trim();
            const targetText = vocabItem.targetText.trim();

            const existingNative = await Phrase.findByUniqueFields(db, {
              text: nativeText,
              lang: vocabItem.nativeLang,
              partSpeech: null,
            });

            // Create native language phrase if it doesn't already exist
            const nativePhrase =
              existingNative ??
              (await phraseCollection.create((phrase) => {
                phrase.text = nativeText;
                phrase.lang = vocabItem.nativeLang;
                phrase.source = 'tutor';
                phrase.partSpeech = null;
                phrase.favorite = false;
                phrase.filename = null;
                phrase.type = nativeText.includes(' ') ? 'phrase' : 'word';
                phrase.note = null;
                phrase.difficulty = null;
                phrase.historyId = null;
                phrase.attemptId = attempt.id;
                phrase.createdAt = now;
                phrase.updatedAt = now;
              }));

            const existingTarget = await Phrase.findByUniqueFields(db, {
              text: targetText,
              lang: vocabItem.targetLang,
              partSpeech: null,
            });

            // Create target language phrase if it doesn't already exist
            const targetPhrase =
              existingTarget ??
              (await phraseCollection.create((phrase) => {
                phrase.text = targetText;
                phrase.lang = vocabItem.targetLang;
                phrase.source = 'tutor';
                phrase.partSpeech = null;
                phrase.favorite = false;
                phrase.filename = null;
                phrase.type = targetText.includes(' ') ? 'phrase' : 'word';
                phrase.note = null;
                phrase.difficulty = null;
                phrase.historyId = null;
                phrase.attemptId = attempt.id;
                phrase.createdAt = now;
                phrase.updatedAt = now;
              }));

            // Create translation linking the two phrases (native as primary, target as secondary)
            await translationCollection.create((translation) => {
              translation.phrasePrimaryId = nativePhrase.id;
              translation.phraseSecondaryId = targetPhrase.id;
              translation.lessonId = lessonId;
              translation.createdAt = now;
              translation.updatedAt = now;
            });
          })
        );
      }

      return attempt;
    });
  }
}
