// Basic company type
export interface Company {
  id?: string | number;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
  site?: string;
  custom_domain?: string;
  subdomain?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  place_id?: string;
  location_reviews_link?: string;
  latitude?: number;
  longitude?: number;
  // Added for template frames
  company_frames?: Record<string, string>;
  template_frames?: Record<string, string>;
  // Geocoded location data (fallbacks for missing city/state)
  geocoded_city?: string;
  geocoded_state?: string;
  geocoded_zip?: string;
  geocoded_country?: string;
  // Added for theme colors
  primary_color?: string;
  secondary_color?: string;
  // Added for address display in templates
  full_address?: string;
  street?: string;
  postal_code?: string;
  email_1?: string;
  // Added for logo processing
  logo?: string;
  logoUrl?: string;
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

// Review type
export interface Review {
  name: string;
  placeId: string;
  text: string | null;
  stars: number;
  publishAt: string;
  publishedAtDate: string;
  responseFromOwnerText?: string | null;
  responseFromOwnerDate?: string | null;
  location?: {
    lat: number;
    lng: number;
  };
}