// Service and job related types

export type JobStatus = 
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'pending_parts';

export const JobStatusLabels: Record<JobStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending_parts: 'Pending Parts'
};

export type JobPriority = 'low' | 'medium' | 'high' | 'emergency';

export const JobPriorityLabels: Record<JobPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  emergency: 'Emergency'
};

export type JobType = 
  | 'maintenance'
  | 'repair'
  | 'installation'
  | 'inspection'
  | 'estimate'
  | 'warranty'
  | 'other';

export const JobTypeLabels: Record<JobType, string> = {
  maintenance: 'Maintenance',
  repair: 'Repair',
  installation: 'Installation',
  inspection: 'Inspection',
  estimate: 'Estimate',
  warranty: 'Warranty Service',
  other: 'Other'
};

export interface Job {
  id: number;
  company_id: string;
  customer_id: number;
  equipment_id?: number | null;
  description: string;
  status: JobStatus;
  priority: JobPriority;
  job_type: JobType;
  scheduled_date: string;
  scheduled_time_start?: string | null;
  scheduled_time_end?: string | null;
  completion_date?: string | null;
  technician?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ServiceRecord {
  id: number;
  job_id?: number | null;
  equipment_id: number;
  company_id: string;
  service_date: string;
  service_type: string;
  technician?: string | null;
  findings: string;
  work_performed: string;
  parts_used?: string | null;
  recommendations?: string | null;
  follow_up_required: boolean;
  created_at: string;
  updated_at?: string | null;
}

// Common job issues for HVAC systems
export const CommonJobIssues = [
  'No cooling',
  'No heating',
  'Insufficient cooling',
  'Insufficient heating',
  'System not turning on',
  'Strange noises',
  'Leaking water',
  'Refrigerant leak',
  'High energy bills',
  'Frequent cycling',
  'Thermostat issues',
  'Blower not working',
  'Frozen coil',
  'Uneven temperatures',
  'Poor airflow',
  'Annual maintenance'
];

// Common service types
export const ServiceTypes = [
  'Seasonal tune-up',
  'Filter replacement',
  'Refrigerant check',
  'System cleaning',
  'Repair',
  'New installation',
  'System replacement',
  'Warranty service',
  'Emergency service',
  'Duct cleaning',
  'Diagnostic inspection'
];

// Common HVAC parts
export const CommonHvacParts = [
  'Air filter',
  'Capacitor',
  'Contactor',
  'Blower motor',
  'Condenser fan motor',
  'Control board',
  'Thermostat',
  'Compressor',
  'Refrigerant',
  'Evaporator coil',
  'Condenser coil',
  'Expansion valve',
  'Ignitor',
  'Flame sensor',
  'Pressure switch',
  'Gas valve',
  'Heat exchanger',
  'Draft inducer motor',
  'Condensate pump',
  'Transformer'
];

// Common technician recommendations
export const CommonRecommendations = [
  'Schedule regular maintenance',
  'Replace aging equipment',
  'Upgrade to higher efficiency system',
  'Install programmable thermostat',
  'Consider duct cleaning',
  'Improve insulation',
  'Add air purification system',
  'Seal duct leaks',
  'Install UV light system',
  'Balance airflow',
  'Replace worn parts soon'
];