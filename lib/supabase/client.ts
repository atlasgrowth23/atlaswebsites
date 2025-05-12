import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client configured with the project's URL and anon key
 */
export function createClient(useServiceRole = false) {
  const apiKey = useServiceRole 
    ? process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY 
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    apiKey!
  );
}