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
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
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
  email?: string
  website?: string
  address?: string
  city?: string
  state?: string
  postal_code?: string
  rating?: number
  review_count?: number
  logo?: string
  custom_domain?: string
  hours?: string
  saturday_hours?: string
  sunday_hours?: string
  emergency_service?: boolean
  created_at?: string
  updated_at?: string
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