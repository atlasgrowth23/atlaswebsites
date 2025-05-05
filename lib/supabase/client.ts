import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Default URLs for development if environment variables are not available
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-supabase-url.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

/**
 * Creates a Supabase client configured with the project's URL and anon key
 */
export function createClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}