import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabaseServiceRole = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

export const supabaseClient = (req: Request) =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('DB_SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });

export type { SupabaseClient };
