import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates a Supabase client configured with the project's URL and anon key
 */
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}