// Invoice and estimate related types

export type InvoiceStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'void'
  | 'cancelled';

export const InvoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  partially_paid: 'Partially Paid',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
  cancelled: 'Cancelled'
};

export type EstimateStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'converted'
  | 'cancelled';

export const EstimateStatusLabels: Record<EstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  converted: 'Converted to Invoice',
  cancelled: 'Cancelled'
};

export type ItemType = 
  | 'service'
  | 'part'
  | 'material'
  | 'labor'
  | 'fee'
  | 'discount'
  | 'other';

export const ItemTypeLabels: Record<ItemType, string> = {
  service: 'Service',
  part: 'Part',
  material: 'Material',
  labor: 'Labor',
  fee: 'Fee',
  discount: 'Discount',
  other: 'Other'
};

export type PaymentMethod = 
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'debit_card'
  | 'bank_transfer'
  | 'online_payment'
  | 'other';

export const PaymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  check: 'Check',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  bank_transfer: 'Bank Transfer',
  online_payment: 'Online Payment',
  other: 'Other'
};

export interface InvoiceItem {
  id?: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  item_type: ItemType;
  tax_rate?: number;
  tax_amount?: number;
  discount_percentage?: number;
  discount_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EstimateItem {
  id?: number;
  estimate_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  item_type: ItemType;
  tax_rate?: number;
  tax_amount?: number;
  discount_percentage?: number;
  discount_amount?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Invoice {
  id?: number;
  company_id: string;
  job_id?: number;
  contact_id: number;
  estimate_id?: number;
  invoice_number: string;
  subtotal_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  date_issued: string;
  due_date?: string;
  date_paid?: string;
  status: InvoiceStatus;
  notes?: string;
  terms?: string;
  payment_instructions?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  items?: InvoiceItem[];
  contact?: any; // Will be expanded to Contact type
  job?: any; // Will be expanded to Job type
  payments?: PaymentTransaction[];
}

export interface Estimate {
  id?: number;
  company_id: string;
  contact_id: number;
  job_id?: number;
  estimate_number: string;
  subtotal_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  date_issued: string;
  date_expires?: string;
  status: EstimateStatus;
  notes?: string;
  terms?: string;
  created_at?: string;
  updated_at?: string;
  
  // Joined data
  items?: EstimateItem[];
  contact?: any; // Will be expanded to Contact type
  job?: any; // Will be expanded to Job type
}

export interface PaymentTransaction {
  id?: number;
  company_id: string;
  invoice_id: number;
  contact_id: number;
  transaction_date: string;
  amount: number;
  payment_method: PaymentMethod;
  payment_reference?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceSettings {
  id?: number;
  company_id: string;
  next_invoice_number: number;
  next_estimate_number: number;
  default_tax_rate?: number;
  default_due_days?: number;
  default_estimate_expiry_days?: number;
  invoice_notes_template?: string;
  estimate_notes_template?: string;
  invoice_terms_template?: string;
  estimate_terms_template?: string;
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Common service descriptions for autocomplete
export const CommonServiceDescriptions = [
  'HVAC System Diagnostic',
  'AC Tune-up and Maintenance',
  'Furnace Tune-up and Maintenance',
  'Heat Pump Tune-up and Maintenance',
  'Thermostat Installation',
  'AC Repair Service',
  'Furnace Repair Service',
  'Ductwork Cleaning',
  'Air Filter Replacement',
  'Refrigerant Recharge',
  'Blower Motor Replacement',
  'Capacitor Replacement',
  'Emergency HVAC Repair',
  'New System Installation',
  'System Replacement',
  'Annual Maintenance Plan'
];

// Common part descriptions
export const CommonPartDescriptions = [
  'Air Filter - Standard',
  'Air Filter - HEPA',
  'Condensate Pump',
  'Contactor',
  'Capacitor - Run',
  'Capacitor - Start',
  'Fan Motor',
  'Blower Motor',
  'Thermostat - Programmable',
  'Thermostat - Smart/WiFi',
  'Refrigerant - R410A (per lb)',
  'Refrigerant - R22 (per lb)',
  'Pressure Switch',
  'Igniter',
  'Flame Sensor',
  'Circuit Board',
  'Transformer',
  'Relay',
  'Valve - Gas'
];

// Standard invoice/estimate terms
export const StandardTermsTemplate = 
`TERMS AND CONDITIONS:
1. Payment is due within [X] days of invoice date.
2. Late payments are subject to a 1.5% monthly finance charge.
3. Warranty: Labor is warranted for 90 days, parts per manufacturer's warranty.
4. Returns/Cancellations must be made within 7 days of service.`;

// Standard payment instructions template
export const StandardPaymentInstructionsTemplate =
`PAYMENT OPTIONS:
1. Check: Make payable to [Company Name]
2. Credit Card: Call our office at [Phone Number]
3. Online: Visit our customer portal at [Website]`;