import { Model } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field, writer } from '@nozbe/watermelondb/decorators';

import { PHRASE_TABLE } from '@/database/schema';

export interface PhraseProps {
  id: string;
  text: string;
  lang: string;
  source: string;
  partSpeech: string | null;
  favorite: boolean;
  filename: string | null;
  type: string;
  note: string | null;
  difficulty: number | null;
  historyId: string | null;
  createdAt: number;
  updatedAt: number;
}

export default class Phrase extends Model {
  static table = PHRASE_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('text') text!: string;
  @field('lang') lang!: string;
  @field('source') source!: string;
  @field('part_speech') partSpeech!: string | null;
  @field('favorite') favorite!: boolean;
  @field('filename') filename!: string | null;
  @field('type') type!: string;
  @field('note') note!: string | null;
  @field('difficulty') difficulty!: number | null;
  @field('history_id') historyId!: string | null;

  static async addPhrase(
    db: Database,
    {
      text,
      lang,
      source,
      partSpeech,
      favorite,
      filename,
      type,
      note,
      difficulty,
      historyId,
    }: Omit<PhraseProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Phrase> {
    return await db.write(async () => {
      return await db.collections.get<Phrase>(PHRASE_TABLE).create((phrase) => {
        phrase.text = text;
        phrase.lang = lang;
        phrase.source = source;
        phrase.partSpeech = partSpeech;
        phrase.favorite = favorite;
        phrase.filename = filename;
        phrase.type = type;
        phrase.note = note;
        phrase.difficulty = difficulty;
        phrase.historyId = historyId;
        phrase.createdAt = Date.now();
        phrase.updatedAt = Date.now();
      });
    });
  }

  @writer async updateFavorite(isFavorite: boolean): Promise<Phrase> {
    const updatedPhrase = await this.update((phrase) => {
      phrase.favorite = isFavorite;
      phrase.updatedAt = Date.now();
    });
    return updatedPhrase;
  }

  @writer async updateLang(newLang: string): Promise<Phrase> {
    return await this.update((phrase) => {
      phrase.lang = newLang;
      phrase.updatedAt = Date.now();
    });
  }

  @writer async updateNote(newNote: string | null): Promise<Phrase> {
    return await this.update((phrase) => {
      phrase.note = newNote;
      phrase.updatedAt = Date.now();
    });
  }

  @writer async updatePartSpeech(newPartSpeech: string | null): Promise<Phrase> {
    return await this.update((phrase) => {
      phrase.partSpeech = newPartSpeech;
      phrase.updatedAt = Date.now();
    });
  }
}
