// Basic company type for site generation
export interface Company {
  id?: string | number;
  name: string;
  slug?: string;
  city?: string;
  state?: string;
  phone?: string;
  rating?: number;
  place_id?: string;
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
  // Added for address display in templates
  full_address?: string;
  street?: string;
  postal_code?: string;
  email_1?: string;
  // Added for logo processing
  logo?: string;
  logoUrl?: string;
  // Display fields from joined geocoded data
  display_city?: string;
  display_state?: string;
  display_postal_code?: string;
  formatted_address?: string;
  // Added for tracking functionality
  tracking_enabled?: boolean;
}