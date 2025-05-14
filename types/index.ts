// Company type matching database schema
export interface Company {
  id: string;
  slug: string;
  subdomain: string | null;
  custom_domain: string | null;
  name: string;
  site: string | null;
  phone: string | null;
  phone_carrier_type: string | null;
  category: string | null;
  street: string | null;
  city: string | null;
  postal_code: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number | null;
  reviews: number | null;
  photos_count: number | null;
  working_hours: string | null;
  about: string | null;
  logo: string | null;
  verified: boolean | null;
  place_id: string | null;
  location_link: string | null;
  location_reviews_link: string | null;
  email_1: string | null;
  email_1_validator_status: string | null;
  email_1_full_name: string | null;
  facebook: string | null;
  instagram: string | null;
  extras: string | null;
  created_at: string | null;
  updated_at: string | null;
  plan: string | null;
}

// Minimal lead type
export interface Lead {
  id?: number;
  company_id: string;
  assigned_to?: number;
  stage_id?: number;
  created_at?: string;
  updated_at?: string;
}