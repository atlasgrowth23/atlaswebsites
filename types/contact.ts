export interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  customer_since: string;
  type: 'residential' | 'commercial';
}

export interface Equipment {
  id: string;
  name: string;
  model: string;
  serial: string;
  installed: string;
  last_service: string;
  status: 'active' | 'maintenance' | 'repair_needed' | 'replaced';
}

export interface ServiceHistory {
  id: string;
  date: string;
  type: string;
  description: string;
  technician: string;
  cost: string;
}