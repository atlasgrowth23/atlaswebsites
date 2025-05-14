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
  // Added for template frames
  company_frames?: Record<string, string>;
  template_frames?: Record<string, string>;
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