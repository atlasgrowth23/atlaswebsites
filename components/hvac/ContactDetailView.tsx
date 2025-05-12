import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EquipmentList from '@/components/equipment/EquipmentList';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import ServiceHistoryList from '@/components/service/ServiceHistoryList';
import ScheduleServiceForm from '@/components/service/ScheduleServiceForm';
import ServiceRecordForm from '@/components/service/ServiceRecordForm';
import { Equipment } from '@/types/equipment';
import { ServiceRecord, Job } from '@/types/service';
import { 
  fetchServiceRecords, 
  createServiceRecord, 
  updateServiceRecord,
  fetchAppointments,
  createAppointment,
  updateJobStatus
} from '@/lib/service-api';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  lastServiceDate: string | null;
  createdAt: string;
}

interface ContactDetailViewProps {
  contact: Contact;
  onClose: () => void;
  equipmentList: Equipment[];
  onSaveEquipment: (equipmentData: Partial<Equipment>) => Promise<Equipment>;
}

export default function ContactDetailView({ 
  contact, 
  onClose,
  equipmentList = [], 
  onSaveEquipment
}: ContactDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'equipment' | 'history' | 'billing'>('details');

  // Equipment states
  const [equipment, setEquipment] = useState<Equipment[]>(equipmentList);
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [isSavingEquipment, setIsSavingEquipment] = useState(false);

  // Service history states
  const [showScheduleService, setShowScheduleService] = useState(false);
  const [showServiceRecord, setShowServiceRecord] = useState(false);
  const [selectedServiceRecord, setSelectedServiceRecord] = useState<ServiceRecord | null>(null);
  const [selectedServiceEquipment, setSelectedServiceEquipment] = useState<number | null>(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingServiceData, setIsLoadingServiceData] = useState(false);

  // Business slug (company ID)
  const [businessSlug, setBusinessSlug] = useState<string>('demo-company');

  useEffect(() => {
    // Get business slug from localStorage
    const storedBusinessSlug = localStorage.getItem('businessSlug');
    if (storedBusinessSlug) {
      setBusinessSlug(storedBusinessSlug);
    }

    // Set equipment data
    setEquipment(equipmentList);

    // Load service history data if on that tab
    if (activeTab === 'history') {
      loadServiceData();
    }
  }, [contact.id, activeTab, equipmentList]);

  // Load service records and appointments from the API
  const loadServiceData = async () => {
    setIsLoadingServiceData(true);
    try {
      // Load in parallel using Promise.all
      const [recordsResult, appointmentsResult] = await Promise.all([
        // Try to fetch from API but fall back to demo data on error
        fetchServiceRecords(businessSlug, contact.id).catch(() => []),
        fetchAppointments(businessSlug, { contactId: contact.id }).catch(() => [])
      ]);

      // Only update state if we got data back
      if (recordsResult && recordsResult.length > 0) {
        setServiceRecords(recordsResult);
      } else {
        // Fall back to demo data
        setServiceRecords(getDemoServiceRecords());
      }

      if (appointmentsResult && appointmentsResult.length > 0) {
        setJobs(appointmentsResult);
      } else {
        // Fall back to demo data
        setJobs(getDemoJobs());
      }
    } catch (err) {
      console.error('Error loading service data:', err);
      // Set demo data as fallback
      setServiceRecords(getDemoServiceRecords());
      setJobs(getDemoJobs());
    } finally {
      setIsLoadingServiceData(false);
    }
  };

  // Handler for adding equipment
  const handleAddEquipment = () => {
    setSelectedEquipment(null);
    setShowAddEquipment(true);
  };

  // Handler for viewing equipment details
  const handleViewEquipment = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setShowAddEquipment(true);
  };

  // Handler for saving equipment
  const handleSaveEquipment = async (equipmentData: Partial<Equipment>) => {
    setIsSavingEquipment(true);

    try {
      const savedEquipment = await onSaveEquipment(equipmentData);
      
      if (selectedEquipment) {
        // Update existing equipment in the list
        setEquipment(prev =>
          prev.map(item =>
            item.id === selectedEquipment.id
              ? savedEquipment
              : item
          )
        );
      } else {
        // Add new equipment to the list
        setEquipment(prev => [...prev, savedEquipment]);
      }
      
      setShowAddEquipment(false);
    } catch (err) {
      console.error('Error saving equipment:', err);
      alert('Failed to save equipment. Please try again.');
    } finally {
      setIsSavingEquipment(false);
    }
  };

  // SERVICE HISTORY HANDLERS

  // Handler for scheduling service
  const handleScheduleService = () => {
    setShowScheduleService(true);
    setShowServiceRecord(false);
    setSelectedServiceRecord(null);
  };

  // Handler for adding service record
  const handleAddServiceRecord = (equipmentId?: number) => {
    setSelectedServiceEquipment(equipmentId || null);
    setSelectedServiceRecord(null);
    setShowServiceRecord(true);
    setShowScheduleService(false);
  };

  // Handler for viewing service record
  const handleViewServiceRecord = (record: ServiceRecord) => {
    setSelectedServiceRecord(record);
    setSelectedServiceEquipment(record.equipment_id);
    setShowServiceRecord(true);
    setShowScheduleService(false);
  };

  // Handler for saving service appointment
  const handleSaveAppointment = async (jobData: Partial<Job>) => {
    setIsSavingService(true);

    try {
      // Send to API
      const appointmentData = {
        ...jobData,
        company_id: businessSlug,
        customer_id: contact.id
      };

      // Try API first, fall back to demo if it fails
      try {
        const savedAppointment = await createAppointment(appointmentData);
        setJobs(prev => [...prev, savedAppointment]);
      } catch (err) {
        console.error('API call failed, using demo data:', err);
        // Just add to state with a mock ID for demo purposes
        const newId = Math.max(...jobs.map(j => j.id), 0) + 1;
        const newJob = {
          ...appointmentData,
          id: newId,
          created_at: new Date().toISOString(),
          status: 'scheduled'
        } as Job;
        setJobs(prev => [...prev, newJob]);
      }

      setShowScheduleService(false);
    } catch (err) {
      console.error('Error saving appointment:', err);
      alert('Failed to schedule service. Please try again.');
    } finally {
      setIsSavingService(false);
    }
  };

  // Handler for saving service record
  const handleSaveServiceRecord = async (recordData: Partial<ServiceRecord>) => {
    setIsSavingService(true);

    try {
      // Prepare record data
      const serviceRecordData = {
        ...recordData,
        company_id: businessSlug,
        equipment_id: selectedServiceEquipment || recordData.equipment_id,
      };

      let savedRecord: ServiceRecord;

      if (selectedServiceRecord) {
        // Try to update via API, fall back if it fails
        try {
          savedRecord = await updateServiceRecord({
            ...serviceRecordData,
            id: selectedServiceRecord.id
          });
          
          // Update in state
          setServiceRecords(prev =>
            prev.map(item =>
              item.id === selectedServiceRecord.id
                ? savedRecord
                : item
            )
          );
        } catch (err) {
          console.error('API call failed, using demo data:', err);
          // Just update in state
          setServiceRecords(prev =>
            prev.map(item =>
              item.id === selectedServiceRecord.id
                ? { ...item, ...serviceRecordData } as ServiceRecord
                : item
            )
          );
        }
      } else {
        // Try to create via API, fall back if it fails
        try {
          savedRecord = await createServiceRecord(serviceRecordData);
          setServiceRecords(prev => [...prev, savedRecord]);
        } catch (err) {
          console.error('API call failed, using demo data:', err);
          // Create with mock ID
          const newId = Math.max(...serviceRecords.map(r => r.id), 0) + 1;
          const newRecord = {
            ...serviceRecordData,
            id: newId,
            created_at: new Date().toISOString()
          } as ServiceRecord;
          setServiceRecords(prev => [...prev, newRecord]);
        }
      }

      // Update equipment's last service date
      if (recordData.equipment_id) {
        const equipId = recordData.equipment_id;
        setEquipment(prev =>
          prev.map(item =>
            item.id === equipId
              ? {
                  ...item,
                  last_service_date: recordData.service_date || null,
                  next_service_date: new Date(
                    new Date(recordData.service_date || Date.now()).setFullYear(
                      new Date(recordData.service_date || Date.now()).getFullYear() + 1
                    )
                  ).toISOString().split('T')[0],
                  service_status: 'good',
                  updated_at: new Date().toISOString()
                }
              : item
          )
        );
      }

      // If this record is for a job, update the job status to completed
      if (recordData.job_id) {
        try {
          // Try API first
          await updateJobStatus(businessSlug, recordData.job_id, 'completed');
        } catch (err) {
          console.error('Failed to update job status via API:', err);
        }
        
        // Update in state regardless
        setJobs(prev =>
          prev.map(job =>
            job.id === recordData.job_id
              ? { ...job, status: 'completed', completion_date: recordData.service_date }
              : job
          )
        );
      }

      setShowServiceRecord(false);
    } catch (err) {
      console.error('Error saving service record:', err);
      alert('Failed to save service record. Please try again.');
    } finally {
      setIsSavingService(false);
    }
  };

  // Demo data for service records
  const getDemoServiceRecords = (): ServiceRecord[] => {
    const equipmentIds = equipment.map(e => e.id);
    const firstEquipId = equipmentIds.length > 0 ? equipmentIds[0] : 1;
    const secondEquipId = equipmentIds.length > 1 ? equipmentIds[1] : (firstEquipId + 1);

    return [
      {
        id: 1,
        equipment_id: firstEquipId,
        company_id: businessSlug,
        job_id: 101,
        service_date: '2023-04-10',
        service_type: 'Annual Maintenance',
        technician: 'Michael Rodriguez',
        findings: 'System is operating at optimal efficiency. Coils are clean and refrigerant levels are within specification.',
        work_performed: 'Performed annual tune-up including cleaning condenser coils, checking refrigerant levels, and testing electrical components.',
        parts_used: 'Air filter, UV bulb',
        recommendations: 'Consider scheduling duct cleaning in the next 6-12 months.',
        follow_up_required: false,
        created_at: '2023-04-10T16:30:00Z'
      },
      {
        id: 2,
        equipment_id: firstEquipId,
        company_id: businessSlug,
        job_id: 95,
        service_date: '2022-05-02',
        service_type: 'Annual Maintenance',
        technician: 'Jennifer Smith',
        findings: 'System is functioning properly but showing signs of dust build-up on condenser coils.',
        work_performed: 'Performed annual maintenance and thorough cleaning of system components.',
        parts_used: 'Air filter',
        recommendations: 'Continue with annual maintenance schedule.',
        follow_up_required: false,
        created_at: '2022-05-02T14:15:00Z'
      },
      {
        id: 3,
        equipment_id: secondEquipId,
        company_id: businessSlug,
        job_id: 84,
        service_date: '2022-11-15',
        service_type: 'Repair',
        technician: 'Robert Johnson',
        findings: 'Pressure switch faulty causing system to cycle improperly. Flame sensor dirty, causing improper ignition.',
        work_performed: 'Replaced pressure switch. Cleaned flame sensor and tested for proper operation. Inspected heat exchanger and verified proper function.',
        parts_used: 'Pressure switch, ignitor',
        recommendations: 'Monitor system for proper cycling. Consider upgrading to high-efficiency model within next 2-3 years.',
        follow_up_required: true,
        created_at: '2022-11-15T11:45:00Z'
      }
    ];
  };

  // Demo data for jobs/appointments
  const getDemoJobs = (): Job[] => {
    return [
      {
        id: 110,
        company_id: businessSlug,
        customer_id: contact.id,
        equipment_id: equipment.length > 0 ? equipment[0].id : undefined,
        description: 'Annual maintenance for AC unit. Customer reported higher energy bills than usual.',
        status: 'scheduled',
        priority: 'medium',
        job_type: 'maintenance',
        scheduled_date: '2024-05-15',
        scheduled_time_start: '13:00',
        scheduled_time_end: '15:00',
        technician: 'Michael Rodriguez',
        notes: 'Customer requests notification before arrival. Use side gate to access backyard unit.',
        created_at: '2024-04-01T09:30:00Z'
      }
    ];
  };

  return (
    <Card className="border-0 shadow-md">
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{contact.name}</h2>
            <p className="text-sm text-gray-500">Customer #{contact.id}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleScheduleService}
          >
            Schedule Service
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contact Details
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'equipment'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Equipment
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Service History
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === 'billing'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Billing
          </button>
        </nav>
      </div>

      {/* Tab content */}
      <CardContent className="p-5">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500">Phone</label>
                  <p className="mt-1 text-gray-900">{contact.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Email</label>
                  <p className="mt-1 text-gray-900">{contact.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Created On</label>
                  <p className="mt-1 text-gray-900">{contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : 'Unknown'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3">Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500">Street Address</label>
                  <p className="mt-1 text-gray-900">{contact.address || 'Not provided'}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">City</label>
                    <p className="mt-1 text-gray-900">{contact.city || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">State</label>
                    <p className="mt-1 text-gray-900">{contact.state || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">ZIP</label>
                    <p className="mt-1 text-gray-900">{contact.zip || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Notes</h3>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-gray-700">
                  {contact.notes || 'No notes available for this contact.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div>
            {showAddEquipment ? (
              <div className="bg-white p-1">
                <EquipmentForm
                  contactId={contact.id}
                  businessSlug={businessSlug}
                  equipment={selectedEquipment || undefined}
                  onSave={handleSaveEquipment}
                  onCancel={() => setShowAddEquipment(false)}
                  isSaving={isSavingEquipment}
                />
              </div>
            ) : (
              <EquipmentList
                equipment={equipment}
                contactId={contact.id}
                onAddClick={handleAddEquipment}
                onViewEquipment={handleViewEquipment}
              />
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {isLoadingServiceData ? (
              <div className="flex justify-center py-8">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading service history...</p>
                </div>
              </div>
            ) : showScheduleService ? (
              <div>
                <ScheduleServiceForm
                  contactId={contact.id}
                  businessSlug={businessSlug}
                  equipment={equipment}
                  onSave={handleSaveAppointment}
                  onCancel={() => setShowScheduleService(false)}
                  isSaving={isSavingService}
                />
              </div>
            ) : showServiceRecord ? (
              <div>
                <ServiceRecordForm
                  equipmentId={selectedServiceEquipment || (equipment.length > 0 ? equipment[0].id : 0)}
                  businessSlug={businessSlug}
                  equipment={equipment}
                  record={selectedServiceRecord || undefined}
                  onSave={handleSaveServiceRecord}
                  onCancel={() => setShowServiceRecord(false)}
                  isSaving={isSavingService}
                />
              </div>
            ) : (
              <ServiceHistoryList
                serviceRecords={serviceRecords}
                equipment={equipment}
                contactId={contact.id}
                onAddClick={handleScheduleService}
                onViewRecord={handleViewServiceRecord}
              />
            )}
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Billing History</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              This customer doesn't have any invoices or payment records yet. These will appear after their first billing cycle.
            </p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
              Create Invoice
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}