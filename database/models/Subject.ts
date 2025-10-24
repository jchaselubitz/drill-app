import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

import { SUBJECT_TABLE } from '../schema';

export default class Subject extends Model {
  static table = SUBJECT_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('name') name!: string | null;
  @field('level') level!: string | null;
  @field('lang') lang!: string;
}
