import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  JobStatus, 
  JobStatusLabels, 
  JobPriority, 
  JobPriorityLabels, 
  JobType, 
  JobTypeLabels 
} from '@/types/service';

interface Contact {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

interface Equipment {
  id: number;
  make: string;
  model: string;
  equipment_type: string;
  serial_number: string;
}

interface JobFormData {
  id?: number;
  customer_id: number | null;
  customer_name?: string;
  description: string;
  status: JobStatus;
  priority: JobPriority;
  job_type: JobType;
  scheduled_date: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  technician?: string;
  notes?: string;
  equipment_id?: number | null;
}

interface JobFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (jobData: JobFormData) => Promise<void>;
  existingJob?: JobFormData;
  isEdit?: boolean;
  businessId: string;
}

export default function JobForm({
  isOpen,
  onClose,
  onSave,
  existingJob,
  isEdit = false,
  businessId
}: JobFormProps) {
  // Form state
  const [formData, setFormData] = useState<JobFormData>({
    customer_id: null,
    description: '',
    status: 'scheduled',
    priority: 'medium',
    job_type: 'repair',
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time_start: '09:00',
    scheduled_time_end: '11:00',
    technician: '',
    notes: '',
  });
  
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [customerEquipment, setCustomerEquipment] = useState<Equipment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Initialize with existing job data if in edit mode
  useEffect(() => {
    if (isEdit && existingJob) {
      setFormData(existingJob);
    }
  }, [isEdit, existingJob]);
  
  // Fetch contacts from API (demo data for now)
  useEffect(() => {
    // Create demo contacts
    const demoContacts: Contact[] = [
      {
        id: 1,
        name: 'John Smith',
        phone: '(555) 123-4567',
        email: 'john@example.com',
        address: '123 Main St, Anytown, CA 12345'
      },
      {
        id: 2,
        name: 'Sarah Williams',
        phone: '(555) 987-6543',
        email: 'sarah@example.com', 
        address: '456 Oak Ave, Springfield, IL 62701'
      },
      {
        id: 3,
        name: 'Michael Rodriguez',
        phone: '(555) 345-6789',
        email: 'michael@example.com',
        address: '789 Pine St, Riverdale, NY 10471'
      },
      {
        id: 4,
        name: 'Emily Johnson',
        phone: '(555) 555-1234',
        email: 'emily@example.com',
        address: '101 Maple Dr, Westview, CA 90210'
      },
      {
        id: 5,
        name: 'Robert Davis',
        phone: '(555) 222-3333',
        email: 'robert@example.com',
        address: '222 Elm St, Lakeside, WA 98001'
      }
    ];
    
    setContacts(demoContacts);
    
    // Demo equipment data
    const demoEquipment: Equipment[] = [
      {
        id: 1,
        make: 'Carrier',
        model: 'Infinity 26',
        equipment_type: 'air_conditioner',
        serial_number: 'AC298374662'
      },
      {
        id: 2,
        make: 'Trane',
        model: 'XR80',
        equipment_type: 'furnace',
        serial_number: 'TNF87652310'
      },
      {
        id: 3,
        make: 'Lennox',
        model: 'Elite Series',
        equipment_type: 'heat_pump',
        serial_number: 'LX45697823'
      },
      {
        id: 4,
        make: 'Rheem',
        model: 'Prestige',
        equipment_type: 'air_conditioner',
        serial_number: 'RH78923156'
      },
    ];
    
    setEquipment(demoEquipment);
    
    // In a real implementation, we'd fetch from the API
    // if (businessId) {
    //   fetch(`/api/hvac/contacts?company_id=${businessId}`)
    //     .then(response => response.json())
    //     .then(data => {
    //       if (data.success && data.contacts) {
    //         setContacts(data.contacts);
    //       }
    //     })
    //     .catch(err => console.error('Error fetching contacts:', err));
    //
    //   fetch(`/api/hvac/equipment?company_id=${businessId}`)
    //     .then(response => response.json())
    //     .then(data => {
    //       if (data.success && data.equipment) {
    //         setEquipment(data.equipment);
    //       }
    //     })
    //     .catch(err => console.error('Error fetching equipment:', err));
    // }
  }, [businessId]);
  
  // When customer changes, filter equipment to show only theirs
  useEffect(() => {
    if (formData.customer_id) {
      // Filter equipment by customer ID
      // In a real app, we'd fetch from API
      // For demo, just use the first couple equipment items
      setCustomerEquipment(equipment.slice(0, 2));
    } else {
      setCustomerEquipment([]);
    }
  }, [formData.customer_id, equipment]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle customer selection
  const handleSelectCustomer = (contact: Contact) => {
    setFormData(prev => ({ 
      ...prev, 
      customer_id: contact.id,
      customer_name: contact.name
    }));
    setIsSearching(false);
    setSearchQuery('');
  };
  
  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery) return false;
    
    const query = searchQuery.toLowerCase();
    return (
      contact.name.toLowerCase().includes(query) ||
      (contact.email && contact.email.toLowerCase().includes(query)) ||
      (contact.phone && contact.phone.includes(query))
    );
  });
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      if (!formData.customer_id) {
        throw new Error('Please select a customer');
      }
      
      if (!formData.description) {
        throw new Error('Please enter a job description');
      }
      
      if (!formData.scheduled_date) {
        throw new Error('Please select a scheduled date');
      }
      
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the job');
      console.error('Error saving job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Job' : 'Create New Job'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Customer Selection */}
              <div>
                <Label htmlFor="customer" className="text-sm font-medium text-gray-700 block mb-1">
                  Customer <span className="text-red-500">*</span>
                </Label>
                {formData.customer_id ? (
                  <div className="flex items-center justify-between p-3 border border-gray-300 rounded-md">
                    <div>
                      <span className="font-medium">{formData.customer_name}</span>
                      <span className="text-sm text-gray-500 ml-2">#{formData.customer_id}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, customer_id: null, customer_name: undefined }))}
                    >
                      Change Customer
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="flex">
                      <Input
                        type="text"
                        placeholder="Search customers by name, email, or phone"
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value);
                          setIsSearching(true);
                        }}
                        onFocus={() => setIsSearching(true)}
                        className="w-full"
                      />
                      <Button
                        type="button"
                        className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        + New Customer
                      </Button>
                    </div>
                    
                    {isSearching && filteredContacts.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <ul className="py-1">
                          {filteredContacts.map(contact => (
                            <li 
                              key={contact.id} 
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => handleSelectCustomer(contact)}
                            >
                              <div className="font-medium">{contact.name}</div>
                              <div className="text-sm text-gray-500 flex">
                                {contact.phone && <span className="mr-3">{contact.phone}</span>}
                                {contact.email && <span>{contact.email}</span>}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Job Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="job_type" className="text-sm font-medium text-gray-700 block mb-1">
                    Job Type <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="job_type"
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    {Object.entries(JobTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700 block mb-1">
                    Priority <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  >
                    {Object.entries(JobPriorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 block mb-1">
                  Job Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the job or issue in detail"
                  rows={3}
                  required
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              {/* Equipment Selection */}
              {formData.customer_id && customerEquipment.length > 0 && (
                <div>
                  <Label htmlFor="equipment_id" className="text-sm font-medium text-gray-700 block mb-1">
                    Equipment (Optional)
                  </Label>
                  <select
                    id="equipment_id"
                    name="equipment_id"
                    value={formData.equipment_id || ''}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select Equipment</option>
                    {customerEquipment.map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.make} {eq.model} - {eq.equipment_type}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Scheduling */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="scheduled_date" className="text-sm font-medium text-gray-700 block mb-1">
                    Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    id="scheduled_date"
                    name="scheduled_date"
                    value={formData.scheduled_date}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="scheduled_time_start" className="text-sm font-medium text-gray-700 block mb-1">
                    Start Time
                  </Label>
                  <Input
                    type="time"
                    id="scheduled_time_start"
                    name="scheduled_time_start"
                    value={formData.scheduled_time_start}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <Label htmlFor="scheduled_time_end" className="text-sm font-medium text-gray-700 block mb-1">
                    End Time
                  </Label>
                  <Input
                    type="time"
                    id="scheduled_time_end"
                    name="scheduled_time_end"
                    value={formData.scheduled_time_end}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </div>
              
              {/* Technician */}
              <div>
                <Label htmlFor="technician" className="text-sm font-medium text-gray-700 block mb-1">
                  Assigned Technician
                </Label>
                <Input
                  type="text"
                  id="technician"
                  name="technician"
                  value={formData.technician || ''}
                  onChange={handleChange}
                  placeholder="Name of technician"
                  className="w-full"
                />
              </div>
              
              {/* Status - Only show for edit mode */}
              {isEdit && (
                <div>
                  <Label htmlFor="status" className="text-sm font-medium text-gray-700 block mb-1">
                    Status
                  </Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    {Object.entries(JobStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Notes */}
              <div>
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700 block mb-1">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes || ''}
                  onChange={handleChange}
                  placeholder="Any additional information or special instructions"
                  rows={2}
                  className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              
              {/* Error display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                  {error}
                </div>
              )}
              
              {/* Form buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    isEdit ? 'Update Job' : 'Create Job'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}