import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or anon key is missing. Ensure they are provided via app.config.ts');
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '');
