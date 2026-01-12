import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

import { TAG_TABLE } from '../schema';

export default class Tag extends Model {
  static table = TAG_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('label') label!: string;
}
