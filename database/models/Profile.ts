import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

import { PROFILE_TABLE } from '../schema';

export default class Profile extends Model {
  static table = PROFILE_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('username') username!: string | null;
  @field('image_url') imageUrl!: string | null;
  @field('user_language') userLanguage!: string | null;
  @field('pref_language') prefLanguage!: string | null;
}
