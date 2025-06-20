// AtlasHVAC TypeScript interfaces for equipment management

export interface Company {
  id: string;
  name: string;
  slug: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  customer_type?: 'Residential' | 'Commercial' | 'Industrial';
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  tenant_id: string;
  contact_id: string;
  equipment_type: EquipmentType;
  brand?: string;
  model_number?: string;
  serial_number?: string;
  location_on_site?: string;
  capacity_size?: string;
  refrigerant?: string;
  efficiency_rating?: string;
  install_date?: string; // DATE format: YYYY-MM-DD
  warranty_ends?: string; // DATE format: YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

export interface EquipmentPhoto {
  id: string;
  tenant_id: string;
  equipment_id: string;
  photo_url: string;
  uploaded_at: string;
}

export interface ServiceNote {
  id: string;
  tenant_id: string;
  contact_id: string;
  date: string; // DATE format: YYYY-MM-DD
  notes: string;
  created_at: string;
}

// Equipment form data (for creating/updating)
export interface EquipmentFormData {
  equipment_type: EquipmentType;
  brand: string;
  model_number: string;
  serial_number: string;
  location_on_site: string;
  capacity_size: string;
  refrigerant: string;
  efficiency_rating: string;
  install_date: string;
  warranty_ends: string;
}

// Enums/Constants
export type EquipmentType = 
  | 'Split AC'
  | 'Furnace'
  | 'Heat Pump'
  | 'Rooftop Unit'
  | 'Chiller'
  | 'Other';

export const EQUIPMENT_TYPES: EquipmentType[] = [
  'Split AC',
  'Furnace', 
  'Heat Pump',
  'Rooftop Unit',
  'Chiller',
  'Other'
];

export const BRANDS = [
  'Trane',
  'Carrier',
  'Lennox',
  'Rheem',
  'Goodman',
  'York',
  'Daikin',
  'Mitsubishi',
  'Other'
];

export const REFRIGERANTS = [
  'R-410A',
  'R-32',
  'R-22',
  'R-134a',
  'R-404A',
  'Other'
];

// Equipment tab state
export type EquipmentView = 'list' | 'details';
export type EquipmentSubTab = 'essentials' | 'technical' | 'photos';