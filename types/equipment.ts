// Equipment type definitions

export type EquipmentType = 
  | 'air_conditioner' 
  | 'furnace' 
  | 'heat_pump' 
  | 'boiler'
  | 'mini_split' 
  | 'packaged_unit' 
  | 'air_handler' 
  | 'thermostats' 
  | 'other';

export const EquipmentTypeLabels: Record<EquipmentType, string> = {
  air_conditioner: 'Air Conditioner',
  furnace: 'Furnace',
  heat_pump: 'Heat Pump',
  boiler: 'Boiler',
  mini_split: 'Mini-Split System',
  packaged_unit: 'Packaged Unit',
  air_handler: 'Air Handler',
  thermostats: 'Thermostat',
  other: 'Other Equipment'
};

export interface Equipment {
  id: number;
  company_id: string;
  contact_id: number;
  equipment_type: string;
  make: string;
  model: string;
  serial_number: string;
  installation_date: string | null;
  btu_rating: number | null;
  tonnage: number | null;
  efficiency_rating: string | null;
  refrigerant_type: string | null;
  location: string | null;
  notes: string | null;
  warranty_expiration: string | null;
  warranty_details: string | null;
  last_service_date: string | null;
  next_service_date: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
  // UI helpers
  service_status?: 'good' | 'due_soon' | 'overdue' | 'unknown';
  warranty_status?: 'active' | 'expired' | 'unknown';
}

export interface EquipmentService {
  id: number;
  equipment_id: number;
  service_date: string;
  service_type: string;
  technician: string | null;
  description: string | null;
  parts_replaced: string | null;
  cost: number | null;
  recommendations: string | null;
  created_at: string;
}

// Common equipment makes for autocomplete
export const CommonEquipmentMakes = [
  'Carrier', 'Trane', 'Lennox', 'Rheem', 'Goodman', 
  'American Standard', 'Bryant', 'York', 'Amana', 'Ruud',
  'Daikin', 'Mitsubishi', 'Fujitsu', 'LG', 'Samsung',
  'Coleman', 'Heil', 'Maytag', 'Payne', 'Comfortmaker'
];

// Common refrigerant types
export const RefrigerantTypes = [
  'R-22', 'R-410A', 'R-32', 'R-134a', 'R-407C', 'R-404A'
];

// Service types
export const ServiceTypes = [
  'Annual Maintenance', 
  'Repair', 
  'Installation',
  'Replacement',
  'Inspection',
  'Cleaning',
  'Emergency Repair',
  'Warranty Service'
];