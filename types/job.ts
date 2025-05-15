export interface Job {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  scheduledDate: string;
  estimatedHours?: number;
  contactId?: string;
  companyId: string;
  createdAt?: string;
  updatedAt?: string;
}