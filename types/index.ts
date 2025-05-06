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
  description?: string;
  address?: string;
  city: string;
  state: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  services?: string[];
  logo?: string;
  logo_override?: string;
  primary_color?: string;
  secondary_color?: string;
}

export interface Review {
  id: number;
  biz_id: string;
  author_name: string;
  rating: number;
  text: string;
  published_at_date: string;
  source?: string;
}