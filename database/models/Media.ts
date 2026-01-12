import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

import { MEDIA_TABLE } from '@/database/schema';

export default class Media extends Model {
  static table = MEDIA_TABLE;

  @field('created_at') createdAt!: number;
  @field('updated_at') updatedAt!: number;
  @field('title') title!: string | null;
  @field('description') description!: string | null;
  @field('media_url') mediaUrl!: string;
  @field('website_url') websiteUrl!: string | null;
  @field('image_url') imageUrl!: string | null;
}
