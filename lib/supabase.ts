import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Client for frontend use
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token'
    }
  }
)

// Admin client for server-side operations (when you need service role)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Database types (we'll expand this as needed)
export type Company = {
  id: string
  name: string
  slug: string
  phone?: string
  email_1?: string
  site?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  rating?: number
  reviews?: number
  reviews_link?: string
  first_review_date?: string
  r_30?: number
  r_60?: number
  r_90?: number
  r_365?: number
  predicted_label?: string
  logo?: string
  logo_storage_path?: string
  custom_domain?: string
  domain_verified?: boolean
  tracking_enabled?: boolean
  tracking_paused?: boolean
  template_key?: string
  hours?: string
  saturday_hours?: string
  sunday_hours?: string
  emergency_service?: boolean
  created_at?: string
  updated_at?: string
  // Additional properties for template rendering
  logoUrl?: string
  latitude?: number
  longitude?: number
}

export type CompanyFrame = {
  id: string
  company_id: string
  slug: string
  url: string
  created_at?: string
  updated_at?: string
}

export type Frame = {
  id: string
  slug: string
  template_key: string
  default_url: string
  description?: string
  created_at?: string
  updated_at?: string
}