import { Model, Q, Query, Relation } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { children, field, immutableRelation } from '@nozbe/watermelondb/decorators';

import { ATTEMPT_TABLE, LESSON_TABLE, SUBJECT_TABLE } from '@/database/schema';

import type Attempt from './Attempt';
import type Subject from './Subject';

export type PromptLanguageType = 'user' | 'learning';

export interface LessonProps {
  id: string;
  topic: string;
  phrases: string | null;
  prompt: string;
  lang: string;
  level: string;
  subjectId?: string | null;
  promptLanguage?: PromptLanguageType;
  createdAt: number;
  updatedAt: number;
}

export default class Lesson extends Model {
  static table = LESSON_TABLE;

  static associations = {
    [ATTEMPT_TABLE]: { type: 'has_many' as const, foreignKey: 'lesson_id' },
    [SUBJECT_TABLE]: { type: 'belongs_to' as const, key: 'subject_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('topic') topic!: string;
  @field('phrases') phrases!: string | null;
  @field('prompt') prompt!: string;
  @field('user_language') userLanguage!: string;
  @field('lang') lang!: string;
  @field('level') level!: string;
  @field('subject_id') subjectId!: string | null;
  @field('prompt_language') promptLanguage!: PromptLanguageType;

  @children(ATTEMPT_TABLE) attempts!: Query<Attempt>;
  @immutableRelation(SUBJECT_TABLE, 'subject_id') subject!: Relation<Subject>;

  static async addLesson(
    db: Database,
    {
      topic,
      phrases,
      prompt,
      lang,
      level,
      subjectId,
      promptLanguage = 'user',
    }: Omit<LessonProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Lesson> {
    return await db.write(async () => {
      return await db.collections.get<Lesson>(LESSON_TABLE).create((lesson) => {
        lesson.topic = topic;
        lesson.phrases = phrases;
        lesson.prompt = prompt;
        lesson.lang = lang;
        lesson.level = level;
        lesson.subjectId = subjectId ?? null;
        lesson.promptLanguage = promptLanguage;
        lesson.createdAt = Date.now();
        lesson.updatedAt = Date.now();
      });
    });
  }

  static async getLessonsBySubject(db: Database, subjectId: string): Promise<Lesson[]> {
    return await db.collections
      .get<Lesson>(LESSON_TABLE)
      .query(Q.where('subject_id', subjectId), Q.sortBy('created_at', Q.desc))
      .fetch();
  }

  static async getStandaloneLessons(db: Database): Promise<Lesson[]> {
    return await db.collections
      .get<Lesson>(LESSON_TABLE)
      .query(Q.where('subject_id', null), Q.sortBy('created_at', Q.desc))
      .fetch();
  }

  async updatePrompt(prompt: string, promptLanguage: PromptLanguageType): Promise<void> {
    await this.update((lesson) => {
      lesson.prompt = prompt;
      lesson.promptLanguage = promptLanguage;
      lesson.updatedAt = Date.now();
    });
  }
}
