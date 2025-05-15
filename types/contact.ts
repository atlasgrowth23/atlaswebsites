export interface Contact {
  id: string;
  company_id: string;
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  notes?: string;
  created_at?: string;
  customer_since?: string; // For UI display, will be calculated from created_at
  type?: 'residential' | 'commercial'; // We'll add this for UI purposes
}

export interface Equipment {
  id: string;
  company_id: string;
  contact_id: string;
  type: string;
  model: string;
  serial: string;
  brand: string;
  install_year?: number;
  extra?: any;
  status?: 'active' | 'maintenance' | 'repair_needed' | 'replaced'; // For UI display
}

export interface Job {
  id: string;
  company_id: string;
  contact_id: string;
  contact_name?: string; // Will be populated when joining with contacts
  tech_id?: string;
  tech_name?: string; // Will be populated when joining with techs (if implemented)
  service_type: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'emergency';
  scheduled_at: string;
  notes?: string;
  address?: string; // Will be populated from contact info
}