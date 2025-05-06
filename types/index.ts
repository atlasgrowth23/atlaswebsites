export interface CompanyColors {
  primary?: string;
  secondary?: string;
  text?: string;
  background?: string;
}

export interface Company {
  id: number;
  biz_id: string;
  slug: string;
  name: string;
  city: string;
  state: string;
  place_id: string;
  logo?: string;
  logo_override?: string;
  description?: string;
  services?: string[];
  phone?: string;
  email?: string;
  website?: string;
  hours?: Record<string, string>;
  address?: string;
  zip_code?: string;
  colors?: CompanyColors;
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