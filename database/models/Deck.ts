import { Model, Q } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field, writer } from '@nozbe/watermelondb/decorators';

import type { CEFRLevel, LanguageCode } from '@/types';

import { DECK_TABLE } from '../schema';

export type DeckSource = 'manual' | 'ai_generated';

export default class Deck extends Model {
  static table = DECK_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('name') name!: string;
  @field('archived') archived!: boolean;
  @field('sort_order') sortOrder!: number | null;
  @field('is_default') isDefault!: boolean;
  @field('source') source!: DeckSource;
  @field('topic') topic!: string | null;
  @field('primary_lang') primaryLang!: string | null;
  @field('secondary_lang') secondaryLang!: string | null;
  @field('level') level!: string | null;
  @field('max_new_per_day') maxNewPerDay!: number | null;
  @field('max_reviews_per_day') maxReviewsPerDay!: number | null;

  static async getDefault(db: Database): Promise<Deck | null> {
    const decks = await db.collections
      .get<Deck>(DECK_TABLE)
      .query(Q.where('is_default', true))
      .fetch();
    return decks[0] ?? null;
  }

  static async getOrCreateDefault(db: Database): Promise<Deck> {
    const existing = await Deck.getDefault(db);
    if (existing) return existing;

    return await db.write(async () => {
      return await db.collections.get<Deck>(DECK_TABLE).create((deck) => {
        deck.name = 'Default';
        deck.archived = false;
        deck.sortOrder = 0;
        deck.isDefault = true;
        deck.source = 'manual';
        deck.topic = null;
        deck.primaryLang = null;
        deck.secondaryLang = null;
        deck.level = null;
        deck.createdAt = Date.now();
        deck.updatedAt = Date.now();
      });
    });
  }

  static async createDeck(db: Database, name: string): Promise<Deck> {
    return await db.write(async () => {
      return await db.collections.get<Deck>(DECK_TABLE).create((deck) => {
        deck.name = name.trim();
        deck.archived = false;
        deck.sortOrder = null;
        deck.isDefault = false;
        deck.source = 'manual';
        deck.topic = null;
        deck.primaryLang = null;
        deck.secondaryLang = null;
        deck.level = null;
        deck.createdAt = Date.now();
        deck.updatedAt = Date.now();
      });
    });
  }

  static async createAISet(
    db: Database,
    {
      name,
      topic,
      primaryLang,
      secondaryLang,
      level,
    }: {
      name: string;
      topic: string;
      primaryLang: LanguageCode;
      secondaryLang: LanguageCode;
      level: CEFRLevel;
    }
  ): Promise<Deck> {
    return await db.write(async () => {
      return await db.collections.get<Deck>(DECK_TABLE).create((deck) => {
        deck.name = name.trim();
        deck.archived = false;
        deck.sortOrder = null;
        deck.isDefault = false;
        deck.source = 'ai_generated';
        deck.topic = topic;
        deck.primaryLang = primaryLang;
        deck.secondaryLang = secondaryLang;
        deck.level = level;
        deck.createdAt = Date.now();
        deck.updatedAt = Date.now();
      });
    });
  }

  static async getAISets(db: Database): Promise<Deck[]> {
    return await db.collections
      .get<Deck>(DECK_TABLE)
      .query(
        Q.where('source', 'ai_generated'),
        Q.where('archived', false),
        Q.sortBy('created_at', Q.desc)
      )
      .fetch();
  }

  @writer async updateName(name: string): Promise<Deck> {
    return await this.update((deck) => {
      deck.name = name.trim();
      deck.updatedAt = Date.now();
    });
  }
}
