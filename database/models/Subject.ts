import { Model, Q, Query, Relation } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { children, field, immutableRelation } from '@nozbe/watermelondb/decorators';

import type { CEFRLevel, LanguageCode } from '@/types';

import { DECK_TABLE, LESSON_TABLE, SUBJECT_TABLE } from '../schema';
import type Deck from './Deck';
import type Lesson from './Lesson';

export interface SubjectProps {
  name: string;
  level: CEFRLevel;
  primaryLang: LanguageCode;
  secondaryLang: LanguageCode;
  deckId?: string | null;
}

export default class Subject extends Model {
  static table = SUBJECT_TABLE;

  static associations = {
    [DECK_TABLE]: { type: 'belongs_to' as const, key: 'deck_id' },
    [LESSON_TABLE]: { type: 'has_many' as const, foreignKey: 'subject_id' },
  };

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('name') name!: string;
  @field('level') level!: string;
  @field('primary_lang') primaryLang!: string;
  @field('secondary_lang') secondaryLang!: string;
  @field('deck_id') deckId!: string | null;

  @immutableRelation(DECK_TABLE, 'deck_id') deck!: Relation<Deck>;
  @children(LESSON_TABLE) lessons!: Query<Lesson>;

  static async createSubject(
    db: Database,
    { name, level, primaryLang, secondaryLang, deckId }: SubjectProps
  ): Promise<Subject> {
    return await db.write(async () => {
      return await db.collections.get<Subject>(SUBJECT_TABLE).create((subject) => {
        subject.name = name;
        subject.level = level;
        subject.primaryLang = primaryLang;
        subject.secondaryLang = secondaryLang;
        subject.deckId = deckId ?? null;
        subject.createdAt = Date.now();
        subject.updatedAt = Date.now();
      });
    });
  }

  static async getAll(db: Database): Promise<Subject[]> {
    return await db.collections
      .get<Subject>(SUBJECT_TABLE)
      .query(Q.sortBy('created_at', Q.desc))
      .fetch();
  }

  static async getById(db: Database, id: string): Promise<Subject | null> {
    try {
      return await db.collections.get<Subject>(SUBJECT_TABLE).find(id);
    } catch {
      return null;
    }
  }

  async updateDeckId(deckId: string): Promise<void> {
    await this.update((subject) => {
      subject.deckId = deckId;
      subject.updatedAt = Date.now();
    });
  }
}
