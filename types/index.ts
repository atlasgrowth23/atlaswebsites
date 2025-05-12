export interface CompanyColors {
  primary: string;
  secondary: string;
}

export interface Company {
  id?: number | null; // Added id field from database
  name: string;
  slug?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  full_address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  reviews?: number | null; // Count
  working_hours?: string | null;
  logo?: string | null;
  logo_override?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  reviews_link?: string | null;
  site_company_insights_founded_year?: number | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  place_id?: string | null;
  // Removed biz_id as it doesn't exist in the database
  site_company_insights_description?: string | null;
  // Additional fields from database schema
  subdomain?: string | null;
  custom_domain?: string | null;
  site?: string | null;
  phone_carrier_type?: string | null;
  category?: string | null;
  street?: string | null;
  postal_code?: string | null;
  photos_count?: number | null;
  about?: string | null;
  verified?: boolean | null;
  location_link?: string | null;
  location_reviews_link?: string | null;
  email_1?: string | null;
  email_1_validator_status?: string | null;
  email_1_full_name?: string | null;
  extras?: any | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface Review {
  id?: number;
  review_id: string;
  biz_id: string;
  place_id: string;
  reviewer_name?: string;
  name?: string; // Matching your actual DB column
  text: string;
  stars: number;
  rating?: number; // Matching your actual DB column
  published_at_date: string;
  reviewer_image?: string;
  reviewer_photo_url?: string; // Matching your actual DB column
  response_text?: string;
  response_from_owner_text?: string; // Matching your actual DB column
  response_date?: string;
  response_from_owner_date?: string; // Matching your actual DB column
  reviews_link?: string;
  review_url?: string; // Matching your actual DB column
}