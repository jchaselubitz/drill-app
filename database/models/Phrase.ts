import { Model } from '@nozbe/watermelondb';
import { field, writer } from '@nozbe/watermelondb/decorators';

import { PHRASE_TABLE } from '../schema';

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

  @writer async addPhrase({
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
  }: Omit<PhraseProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Phrase> {
    return await this.collections.get<Phrase>(PHRASE_TABLE).create((phrase) => {
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
  }
}
