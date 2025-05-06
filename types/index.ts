export interface CompanyColors {
  primary: string;
  secondary: string;
}

export interface Company {
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
  biz_id?: string | number | null;
  site_company_insights_description?: string | null;
}

export interface Review {
  id: number;
  review_id: string;
  biz_id: string;
  place_id: string;
  reviewer_name: string;
  text: string;
  stars: number;
  published_at_date: string;
  reviewer_image?: string;
  response_text?: string;
  response_date?: string;
}