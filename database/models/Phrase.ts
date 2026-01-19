import { Model, Q } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field, writer } from '@nozbe/watermelondb/decorators';

import { PHRASE_TABLE } from '@/database/schema';
import { deleteAudioFile } from '@/lib/audio/storage';

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
  attemptId: string | null;
  createdAt: number;
  updatedAt: number;
}

export const DUPLICATE_PHRASE_ERROR_MESSAGE = 'That word already exists in your library';

type PhraseUniqueFields = Pick<PhraseProps, 'text' | 'lang' | 'partSpeech'>;

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
  @field('attempt_id') attemptId!: string | null;

  static async findByUniqueFields(
    db: Database,
    { text, lang, partSpeech }: PhraseUniqueFields
  ): Promise<Phrase | null> {
    const normalizedText = text.trim();
    const normalizedPartSpeech = partSpeech ?? null;

    const matches = await db.collections
      .get<Phrase>(PHRASE_TABLE)
      .query(
        Q.where('text', normalizedText),
        Q.where('lang', lang),
        Q.where('part_speech', normalizedPartSpeech)
      )
      .fetch();

    return matches[0] ?? null;
  }

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
      attemptId,
    }: Omit<PhraseProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Phrase> {
    const normalizedText = text.trim();
    const existing = await Phrase.findByUniqueFields(db, {
      text: normalizedText,
      lang,
      partSpeech,
    });

    if (existing) {
      throw new Error(DUPLICATE_PHRASE_ERROR_MESSAGE);
    }

    return await db.write(async () => {
      return await db.collections.get<Phrase>(PHRASE_TABLE).create((phrase) => {
        phrase.text = normalizedText;
        phrase.lang = lang;
        phrase.source = source;
        phrase.partSpeech = partSpeech;
        phrase.favorite = favorite;
        phrase.filename = filename;
        phrase.type = type;
        phrase.note = note;
        phrase.difficulty = difficulty;
        phrase.historyId = historyId;
        phrase.attemptId = attemptId ?? null;
        phrase.createdAt = Date.now();
        phrase.updatedAt = Date.now();
      });
    });
  }

  static async findOrCreatePhrase(
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
      attemptId,
    }: Omit<PhraseProps, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Phrase> {
    const normalizedText = text.trim();
    const existing = await Phrase.findByUniqueFields(db, {
      text: normalizedText,
      lang,
      partSpeech,
    });

    if (existing) {
      return existing;
    }

    return await db.write(async () => {
      return await db.collections.get<Phrase>(PHRASE_TABLE).create((phrase) => {
        phrase.text = normalizedText;
        phrase.lang = lang;
        phrase.source = source;
        phrase.partSpeech = partSpeech;
        phrase.favorite = favorite;
        phrase.filename = filename;
        phrase.type = type;
        phrase.note = note;
        phrase.difficulty = difficulty;
        phrase.historyId = historyId;
        phrase.attemptId = attemptId ?? null;
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

  @writer async updateText(newText: string): Promise<Phrase> {
    return await this.update((phrase) => {
      phrase.text = newText.trim();
      phrase.updatedAt = Date.now();
    });
  }

  @writer async updateFilename(newFilename: string | null): Promise<Phrase> {
    const oldFilename = this.filename;

    const updatedPhrase = await this.update((phrase) => {
      phrase.filename = newFilename;
      phrase.updatedAt = Date.now();
    });

    // Delete old audio file if it exists and is different from the new one
    if (oldFilename && oldFilename !== newFilename) {
      try {
        await deleteAudioFile(oldFilename);
      } catch (error) {
        // Log error but don't fail the update if audio file deletion fails
        console.warn(`Failed to delete old audio file ${oldFilename}:`, error);
      }
    }

    return updatedPhrase;
  }

  /**
   * Deletes the phrase and its associated audio file (if any).
   */
  async deleteWithAudio(): Promise<void> {
    const filename = this.filename;

    // Delete the phrase from the database
    await this.destroyPermanently();

    // Delete the audio file if it exists
    if (filename) {
      try {
        await deleteAudioFile(filename);
      } catch (error) {
        // Log error but don't fail the deletion if audio file deletion fails
        console.warn(`Failed to delete audio file ${filename}:`, error);
      }
    }
  }
}
