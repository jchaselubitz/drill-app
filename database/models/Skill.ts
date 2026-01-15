import { Model } from '@nozbe/watermelondb';
import { Q } from '@nozbe/watermelondb';
import Database from '@nozbe/watermelondb/Database';
import { field } from '@nozbe/watermelondb/decorators';

import { SKILL_TABLE } from '@/database/schema';
import type { SkillCategory, SkillRank, SkillStatus } from '@/types';

export interface SkillProps {
  id: string;
  name: string;
  category: SkillCategory;
  rank: SkillRank;
  description: string;
  lastSeenAt: number;
  occurrenceCount: number;
  status: SkillStatus;
  lang: string;
  createdAt: number;
  updatedAt: number;
}

export default class Skill extends Model {
  static table = SKILL_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('name') name!: string;
  @field('category') category!: SkillCategory;
  @field('rank') rank!: SkillRank;
  @field('description') description!: string;
  @field('last_seen_at') lastSeenAt!: number;
  @field('occurrence_count') occurrenceCount!: number;
  @field('status') status!: SkillStatus;
  @field('lang') lang!: string;

  static async findByNameAndCategory(
    db: Database,
    name: string,
    category: SkillCategory,
    lang: string
  ): Promise<Skill | null> {
    const skills = await db.collections
      .get<Skill>(SKILL_TABLE)
      .query(Q.where('name', name), Q.where('category', category), Q.where('lang', lang))
      .fetch();
    return skills[0] ?? null;
  }

  static async upsertSkill(
    db: Database,
    skill: Omit<SkillProps, 'id' | 'createdAt' | 'updatedAt' | 'occurrenceCount' | 'status'>
  ): Promise<Skill> {
    const existing = await Skill.findByNameAndCategory(db, skill.name, skill.category, skill.lang);
    const now = Date.now();

    if (existing) {
      return await db.write(async () => {
        await existing.update((s) => {
          s.rank = skill.rank;
          s.description = skill.description;
          s.lastSeenAt = now;
          s.occurrenceCount = existing.occurrenceCount + 1;
          s.status = 'active';
          s.updatedAt = now;
        });
        return existing;
      });
    } else {
      return await db.write(async () => {
        return await db.collections.get<Skill>(SKILL_TABLE).create((s) => {
          s.name = skill.name;
          s.category = skill.category;
          s.rank = skill.rank;
          s.description = skill.description;
          s.lastSeenAt = now;
          s.occurrenceCount = 1;
          s.status = 'active';
          s.lang = skill.lang;
          s.createdAt = now;
          s.updatedAt = now;
        });
      });
    }
  }

  static async updateStaleStatuses(db: Database): Promise<void> {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const sixtyDaysAgo = Date.now() - 60 * 24 * 60 * 60 * 1000;

    const activeSkills = await db.collections
      .get<Skill>(SKILL_TABLE)
      .query(Q.where('status', 'active'))
      .fetch();

    await db.write(async () => {
      for (const skill of activeSkills) {
        if (skill.lastSeenAt < sixtyDaysAgo) {
          await skill.update((s) => {
            s.status = 'resolved';
            s.updatedAt = Date.now();
          });
        } else if (skill.lastSeenAt < thirtyDaysAgo) {
          await skill.update((s) => {
            s.status = 'improving';
            s.updatedAt = Date.now();
          });
        }
      }
    });
  }

  static async getAllSkills(db: Database, lang?: string): Promise<Skill[]> {
    if (lang) {
      return await db.collections
        .get<Skill>(SKILL_TABLE)
        .query(
          Q.where('lang', lang),
          Q.sortBy('rank', Q.desc),
          Q.sortBy('occurrence_count', Q.desc)
        )
        .fetch();
    }
    return await db.collections
      .get<Skill>(SKILL_TABLE)
      .query(Q.sortBy('rank', Q.desc), Q.sortBy('occurrence_count', Q.desc))
      .fetch();
  }
}
