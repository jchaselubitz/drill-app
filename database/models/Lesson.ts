import { Model, Query } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { children, field } from '@nozbe/watermelondb/decorators';

import { ATTEMPT_TABLE, LESSON_TABLE } from '@/database/schema';

import type Attempt from './Attempt';

export interface LessonProps {
  id: string;
  topic: string;
  phrases: string | null;
  prompt: string;
  lang: string;
  level: string;
  createdAt: number;
  updatedAt: number;
}

export default class Lesson extends Model {
  static table = LESSON_TABLE;

  static associations = {
    [ATTEMPT_TABLE]: { type: 'has_many' as const, foreignKey: 'lesson_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('topic') topic!: string;
  @field('phrases') phrases!: string | null;
  @field('prompt') prompt!: string;
  @field('user_language') userLanguage!: string;
  @field('lang') lang!: string;
  @field('level') level!: string;

  @children(ATTEMPT_TABLE) attempts!: Query<Attempt>;

  static async addLesson(
    db: Database,
    { topic, phrases, prompt, lang, level }: Omit<LessonProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Lesson> {
    return await db.write(async () => {
      return await db.collections.get<Lesson>(LESSON_TABLE).create((lesson) => {
        lesson.topic = topic;
        lesson.phrases = phrases;
        lesson.prompt = prompt;
        lesson.lang = lang;
        lesson.level = level;
        lesson.createdAt = Date.now();
        lesson.updatedAt = Date.now();
      });
    });
  }
}
