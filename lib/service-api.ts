/**
 * API client functions for HVAC service-related operations
 */

import { Job, ServiceRecord } from '@/types/service';

/**
 * Fetch service records for a contact
 */
export async function fetchServiceRecords(companyId: string, contactId: number, options?: { equipmentId?: number }): Promise<ServiceRecord[]> {
  try {
    let url = `/api/hvac/service-records?company_id=${companyId}&contact_id=${contactId}`;
    
    if (options?.equipmentId) {
      url += `&equipment_id=${options.equipmentId}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch service records');
    }
    
    return data.serviceRecords || [];
  } catch (error) {
    console.error('Error fetching service records:', error);
    throw error;
  }
}

/**
 * Fetch a single service record by ID
 */
export async function fetchServiceRecord(companyId: string, recordId: number): Promise<ServiceRecord> {
  try {
    const response = await fetch(`/api/hvac/service-records?company_id=${companyId}&id=${recordId}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch service record');
    }
    
    return data.serviceRecord;
  } catch (error) {
    console.error('Error fetching service record:', error);
    throw error;
  }
}

/**
 * Create a new service record
 */
export async function createServiceRecord(record: Partial<ServiceRecord>): Promise<ServiceRecord> {
  try {
    const response = await fetch('/api/hvac/service-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create service record');
    }
    
    return data.serviceRecord;
  } catch (error) {
    console.error('Error creating service record:', error);
    throw error;
  }
}

/**
 * Update an existing service record
 */
export async function updateServiceRecord(record: Partial<ServiceRecord>): Promise<ServiceRecord> {
  try {
    const response = await fetch('/api/hvac/service-records', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(record),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update service record');
    }
    
    return data.serviceRecord;
  } catch (error) {
    console.error('Error updating service record:', error);
    throw error;
  }
}

/**
 * Delete a service record
 */
export async function deleteServiceRecord(companyId: string, recordId: number): Promise<boolean> {
  try {
    const response = await fetch('/api/hvac/service-records', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        id: recordId
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to delete service record');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting service record:', error);
    throw error;
  }
}

/**
 * Fetch appointments (scheduled jobs) for a contact
 */
export async function fetchAppointments(
  companyId: string, 
  options?: { 
    contactId?: number, 
    dateRange?: 'today' | 'tomorrow' | 'week' | 'month', 
    fromDate?: string,
    toDate?: string,
    technician?: string
  }
): Promise<Job[]> {
  try {
    let url = `/api/hvac/appointments?company_id=${companyId}`;
    
    if (options?.contactId) {
      url += `&contact_id=${options.contactId}`;
    }
    
    if (options?.dateRange) {
      url += `&date_range=${options.dateRange}`;
    }
    
    if (options?.fromDate) {
      url += `&from_date=${options.fromDate}`;
    }
    
    if (options?.toDate) {
      url += `&to_date=${options.toDate}`;
    }
    
    if (options?.technician) {
      url += `&technician=${encodeURIComponent(options.technician)}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch appointments');
    }
    
    return data.appointments || [];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

/**
 * Create a new appointment (scheduled job)
 */
export async function createAppointment(appointment: Partial<Job>): Promise<Job> {
  try {
    const response = await fetch('/api/hvac/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointment),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to create appointment');
    }
    
    return data.appointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
}

/**
 * Update an existing appointment
 */
export async function updateAppointment(appointment: Partial<Job>): Promise<Job> {
  try {
    const response = await fetch('/api/hvac/appointments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointment),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update appointment');
    }
    
    return data.appointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
}

/**
 * Cancel an appointment
 */
export async function cancelAppointment(companyId: string, appointmentId: number, reason?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/hvac/appointments', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        id: appointmentId,
        cancellation_reason: reason
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to cancel appointment');
    }
    
    return true;
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    throw error;
  }
}

/**
 * Update a job's status
 */
export async function updateJobStatus(
  companyId: string, 
  jobId: number, 
  status: string, 
  options?: { 
    technician?: string, 
    notes?: string 
  }
): Promise<Job> {
  try {
    const response = await fetch('/api/hvac/job-status', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        company_id: companyId,
        id: jobId,
        status,
        technician: options?.technician,
        notes: options?.notes
      }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to update job status');
    }
    
    return data.job;
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
}