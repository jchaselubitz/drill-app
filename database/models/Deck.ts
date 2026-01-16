import { Model, Q } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field, writer } from '@nozbe/watermelondb/decorators';

import { DECK_TABLE } from '../schema';

export default class Deck extends Model {
  static table = DECK_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('name') name!: string;
  @field('archived') archived!: boolean;
  @field('sort_order') sortOrder!: number | null;
  @field('is_default') isDefault!: boolean;

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
        deck.createdAt = Date.now();
        deck.updatedAt = Date.now();
      });
    });
  }

  @writer async updateName(name: string): Promise<Deck> {
    return await this.update((deck) => {
      deck.name = name.trim();
      deck.updatedAt = Date.now();
    });
  }
}
