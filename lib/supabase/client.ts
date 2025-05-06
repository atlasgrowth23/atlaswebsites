import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client configured with the project's URL and anon key
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}