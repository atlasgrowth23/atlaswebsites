import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Equipment, EquipmentType, EquipmentTypeLabels, RefrigerantTypes } from '@/types/equipment';
import { ServiceRecord } from '@/types/service';
import EquipmentForm from '@/components/hvac/EquipmentForm';

export default function EquipmentDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [relatedJobs, setRelatedJobs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Calculate age of equipment
  const calculateAge = (installationDate: string | null) => {
    if (!installationDate) return 'Unknown';
    
    try {
      const installDate = new Date(installationDate);
      const currentDate = new Date();
      
      const ageInMs = currentDate.getTime() - installDate.getTime();
      const ageInYears = ageInMs / (1000 * 60 * 60 * 24 * 365.25);
      
      if (ageInYears < 1) {
        const ageInMonths = Math.floor(ageInYears * 12);
        return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''}`;
      }
      
      const years = Math.floor(ageInYears);
      const months = Math.floor((ageInYears - years) * 12);
      
      return months > 0 
        ? `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`
        : `${years} year${years !== 1 ? 's' : ''}`;
    } catch (e) {
      return 'Unknown';
    }
  };

  // Get status badge style
  const getServiceStatusStyle = (status: string | undefined) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800';
      case 'due_soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarrantyStatusStyle = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get service status text
  const getServiceStatusText = (status: string | undefined) => {
    switch (status) {
      case 'good':
        return 'Recently Serviced';
      case 'due_soon':
        return 'Service Due Soon';
      case 'overdue':
        return 'Service Overdue';
      default:
        return 'Service Status Unknown';
    }
  };

  // Get warranty status text
  const getWarrantyStatusText = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return 'In Warranty';
      case 'expired':
        return 'Warranty Expired';
      default:
        return 'Warranty Status Unknown';
    }
  };

  // Fetch equipment details
  useEffect(() => {
    async function fetchEquipmentDetails() {
      if (!id) return;
      
      try {
        // Get business slug from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        setBusinessSlug(storedBusinessSlug);

        if (!storedBusinessSlug) {
          setIsLoading(false);
          return;
        }

        // Create demo equipment data
        const demoEquipment: Equipment = {
          id: parseInt(id as string),
          company_id: 'demo-company',
          contact_id: 1,
          equipment_type: 'air_conditioner',
          make: 'Carrier',
          model: 'Infinity 26',
          serial_number: 'AC298374662',
          installation_date: '2020-05-15',
          btu_rating: 36000,
          tonnage: 3.0,
          efficiency_rating: '26 SEER',
          refrigerant_type: 'R-410A',
          location: 'Backyard',
          notes: 'Premium high-efficiency unit installed after customer had issues with previous builder-grade system.',
          warranty_expiration: '2030-05-15',
          warranty_details: '10 year parts, 10 year compressor',
          last_service_date: '2023-04-10',
          next_service_date: '2024-04-10',
          image_url: null,
          created_at: '2020-05-15T10:30:00Z',
          updated_at: '2023-04-10T14:22:15Z',
          service_status: 'good',
          warranty_status: 'active'
        };

        // Create demo service records
        const demoServiceRecords: ServiceRecord[] = [
          {
            id: 1,
            job_id: 101,
            equipment_id: parseInt(id as string),
            company_id: 'demo-company',
            service_date: '2023-04-10',
            service_type: 'Annual Maintenance',
            technician: 'Mike Johnson',
            findings: 'Unit in good condition. Refrigerant levels optimal. No issues found.',
            work_performed: 'Cleaned condenser coils, checked refrigerant levels, inspected electrical connections, replaced air filter.',
            parts_used: 'Premium air filter',
            recommendations: null,
            follow_up_required: false,
            created_at: '2023-04-10T14:22:15Z',
            updated_at: null
          },
          {
            id: 2,
            job_id: 85,
            equipment_id: parseInt(id as string),
            company_id: 'demo-company',
            service_date: '2022-04-15',
            service_type: 'Annual Maintenance',
            technician: 'Chris Davis',
            findings: 'Condenser coils dirty. Refrigerant levels slightly low.',
            work_performed: 'Cleaned condenser coils, added refrigerant, replaced air filter.',
            parts_used: 'Air filter, 0.5 lbs R-410A refrigerant',
            recommendations: 'Consider installing equipment cover to protect from debris.',
            follow_up_required: false,
            created_at: '2022-04-15T11:30:45Z',
            updated_at: null
          },
          {
            id: 3,
            job_id: 42,
            equipment_id: parseInt(id as string),
            company_id: 'demo-company',
            service_date: '2021-04-20',
            service_type: 'Repair',
            technician: 'Alex Wong',
            findings: 'Capacitor failing, causing intermittent operation.',
            work_performed: 'Replaced start capacitor and inspected surrounding components.',
            parts_used: '45/5 MFD Dual Run Capacitor',
            recommendations: null,
            follow_up_required: false,
            created_at: '2021-04-20T09:15:30Z',
            updated_at: null
          }
        ];

        // Create demo related jobs
        const demoRelatedJobs = [
          {
            id: 101,
            customer_id: 1,
            description: 'Annual maintenance and inspection',
            status: 'completed',
            job_type: 'maintenance',
            scheduled_date: '2023-04-10',
            technician: 'Mike Johnson',
            created_at: '2023-04-03T10:00:00Z'
          },
          {
            id: 85,
            customer_id: 1,
            description: 'Annual maintenance and inspection',
            status: 'completed',
            job_type: 'maintenance',
            scheduled_date: '2022-04-15',
            technician: 'Chris Davis',
            created_at: '2022-04-08T14:30:00Z'
          },
          {
            id: 42,
            customer_id: 1,
            description: 'AC not cooling consistently, cycling on and off',
            status: 'completed',
            job_type: 'repair',
            scheduled_date: '2021-04-20',
            technician: 'Alex Wong',
            created_at: '2021-04-19T16:15:00Z'
          }
        ];

        setEquipment(demoEquipment);
        setServiceRecords(demoServiceRecords);
        setRelatedJobs(demoRelatedJobs);

        // Attempt to fetch real data
        try {
          // In a real implementation, fetch from API
          // const response = await fetch(`/api/hvac/equipment/${id}?company_id=${storedBusinessSlug}`);
          // const data = await response.json();
          
          // if (data.success && data.equipment) {
          //   setEquipment(data.equipment);
          //   setServiceRecords(data.serviceRecords || []);
          //   setRelatedJobs(data.relatedJobs || []);
          // }
        } catch (apiError) {
          console.error('API error (non-blocking):', apiError);
        }

      } catch (err) {
        console.error('Error fetching equipment details:', err);
        setError('Unable to load equipment details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEquipmentDetails();
  }, [id]);

  // Convert age to status class
  const getAgeStatusClass = (age: string) => {
    if (age === 'Unknown') return 'text-gray-500';
    
    // Extract years from age string
    const yearsMatch = age.match(/(\d+) year/);
    if (!yearsMatch) return 'text-green-600'; // Less than a year old
    
    const years = parseInt(yearsMatch[1]);
    
    if (years < 5) return 'text-green-600';
    if (years < 10) return 'text-yellow-600';
    if (years < 15) return 'text-orange-600';
    return 'text-red-600';
  };

  // Handle edit button click
  const handleEdit = () => {
    setShowEditModal(true);
  };

  // Handle schedule service button click
  const handleScheduleService = () => {
    // In a real implementation, navigate to create job page with equipment pre-selected
    router.push('/hvacportal/jobs?new=true&equipment_id=' + id);
  };

  // Get the business slug in the correct format for the PortalLayout
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;

  if (isLoading) {
    return (
      <PortalLayout businessSlug={businessSlugProp}>
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
            <p className="mt-3 text-gray-500">Loading equipment details...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !equipment) {
    return (
      <PortalLayout businessSlug={businessSlugProp}>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-800">{error || 'Equipment not found'}</p>
          <Link href="/hvacportal/equipment">
            <button className="mt-4 text-blue-600 hover:text-blue-800 hover:underline">
              &larr; Back to Equipment
            </button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  const equipmentAge = calculateAge(equipment.installation_date);
  const ageStatusClass = getAgeStatusClass(equipmentAge);

  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        {/* Header with back link and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/hvacportal/equipment">
                <button className="text-blue-600 hover:text-blue-800 hover:underline">
                  &larr; Back to Equipment
                </button>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Equipment #{equipment.id}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{equipment.make} {equipment.model}</h1>
            <p className="text-gray-500">{EquipmentTypeLabels[equipment.equipment_type as EquipmentType] || equipment.equipment_type}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              onClick={handleEdit}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleScheduleService}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Service
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Equipment Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">Equipment Details</CardTitle>
                  <div className="flex gap-2">
                    {equipment.service_status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceStatusStyle(equipment.service_status)}`}>
                        {getServiceStatusText(equipment.service_status)}
                      </span>
                    )}
                    {equipment.warranty_status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWarrantyStatusStyle(equipment.warranty_status)}`}>
                        {getWarrantyStatusText(equipment.warranty_status)}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">General Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Make:</span>
                        <span className="text-gray-900 font-medium">{equipment.make}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Model:</span>
                        <span className="text-gray-900 font-medium">{equipment.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Serial Number:</span>
                        <span className="text-gray-900">{equipment.serial_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="text-gray-900">{EquipmentTypeLabels[equipment.equipment_type as EquipmentType] || equipment.equipment_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-900">{equipment.location || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Age:</span>
                        <span className={`font-medium ${ageStatusClass}`}>{equipmentAge}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Technical Specifications</h3>
                    <div className="space-y-3">
                      {equipment.btu_rating && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">BTU Rating:</span>
                          <span className="text-gray-900">{equipment.btu_rating.toLocaleString()} BTU</span>
                        </div>
                      )}
                      {equipment.tonnage && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tonnage:</span>
                          <span className="text-gray-900">{equipment.tonnage} Ton{equipment.tonnage !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {equipment.efficiency_rating && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Efficiency:</span>
                          <span className="text-gray-900">{equipment.efficiency_rating}</span>
                        </div>
                      )}
                      {equipment.refrigerant_type && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Refrigerant:</span>
                          <span className="text-gray-900">{equipment.refrigerant_type}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Installation Date:</span>
                        <span className="text-gray-900">{formatDate(equipment.installation_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Warranty Information */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">Warranty Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Warranty Until:</span>
                      <span className="text-gray-900">{formatDate(equipment.warranty_expiration)}</span>
                    </div>
                    {equipment.warranty_details && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Coverage:</span>
                        <span className="text-gray-900">{equipment.warranty_details}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Service Schedule */}
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-medium text-gray-900 mb-4">Service Schedule</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Service:</span>
                      <span className="text-gray-900">{formatDate(equipment.last_service_date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Next Service Due:</span>
                      <span className={`text-gray-900 ${
                        equipment.service_status === 'overdue' ? 'text-red-600 font-medium' : 
                        equipment.service_status === 'due_soon' ? 'text-yellow-600 font-medium' : ''
                      }`}>
                        {formatDate(equipment.next_service_date)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                {equipment.notes && (
                  <div className="pt-4 border-t border-gray-100">
                    <h3 className="font-medium text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700">{equipment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service History */}
            <Card className="mt-6">
              <CardHeader className="border-b border-gray-100 pb-4 flex flex-row justify-between">
                <CardTitle className="text-lg font-medium">Service History</CardTitle>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleScheduleService}
                >
                  + Add Service Record
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                {serviceRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No service records found for this equipment.</p>
                    <Button
                      className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={handleScheduleService}
                    >
                      Schedule First Service
                    </Button>
                  </div>
                ) : (
                  <div className="relative pl-8 space-y-6 before:absolute before:inset-y-0 before:left-7 before:w-px before:bg-gray-200">
                    {serviceRecords.map((record) => (
                      <div
                        key={record.id}
                        className="relative pt-2 pb-4"
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-8 -translate-x-1/2 mt-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-gray-400"></div>
                        
                        <Card className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium text-gray-900">{record.service_type}</h4>
                                <p className="text-sm text-gray-500">
                                  {formatDate(record.service_date)} • Technician: {record.technician || 'Not specified'}
                                </p>
                              </div>
                              <Link href={`/hvacportal/jobs/${record.job_id}`}>
                                <button className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                                  View Job
                                </button>
                              </Link>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                              <div>
                                <h5 className="font-medium text-gray-700 mb-1">Findings</h5>
                                <p className="text-gray-600">{record.findings}</p>
                              </div>
                              <div>
                                <h5 className="font-medium text-gray-700 mb-1">Work Performed</h5>
                                <p className="text-gray-600">{record.work_performed}</p>
                              </div>
                            </div>
                            
                            {record.parts_used && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <h5 className="font-medium text-gray-700 text-sm mb-1">Parts Used</h5>
                                <p className="text-gray-600 text-sm">{record.parts_used}</p>
                              </div>
                            )}
                            
                            {record.follow_up_required && (
                              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                  Follow-up required
                                </span>
                                {record.recommendations && (
                                  <span className="ml-2 text-sm text-gray-500">
                                    {record.recommendations}
                                  </span>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Customer info card */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-medium">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-medium mr-3">
                      JS
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">John Smith</h3>
                      <p className="text-sm text-gray-500">Customer #1</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 pt-2">
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>(555) 123-4567</span>
                    </div>
                    
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>john@example.com</span>
                    </div>
                    
                    <div className="flex">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p>123 Main St</p>
                        <p>Anytown, CA 12345</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2 mt-3 border-t border-gray-100">
                    <Link href={`/hvacportal/contacts/1`}>
                      <button className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                        View Customer Details →
                      </button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Jobs Card */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-medium">Related Jobs</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {relatedJobs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No jobs related to this equipment.</p>
                ) : (
                  <div className="space-y-4">
                    {relatedJobs.map(job => (
                      <div key={job.id} className="border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-gray-900">Job #{job.id}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            job.status === 'completed' ? 'bg-green-100 text-green-800' :
                            job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{formatDate(job.scheduled_date)}</span>
                          <Link href={`/hvacportal/jobs/${job.id}`}>
                            <button className="text-blue-600 hover:text-blue-800 hover:underline">
                              View Job
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    onClick={handleScheduleService}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Schedule Service</span>
                  </button>
                  
                  <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Create Service Record</span>
                  </button>
                  
                  <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors" 
                    onClick={handleEdit}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Edit Equipment</span>
                  </button>
                  
                  <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Equipment</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Equipment Modal */}
      {showEditModal && equipment && (
        <EquipmentForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={async (equipmentData) => {
            try {
              // In a real implementation, this would call the API to update the equipment
              // For demo, update the local state
              const updatedEquipment = {
                ...equipment,
                ...equipmentData,
                updated_at: new Date().toISOString(),
                // Update UI helper fields based on new data
                warranty_status: equipmentData.warranty_expiration
                  ? new Date(equipmentData.warranty_expiration as string) > new Date()
                    ? 'active' : 'expired'
                  : 'unknown'
              };

              setEquipment(updatedEquipment);
              setShowEditModal(false);
              alert('Equipment updated successfully!');
            } catch (err: any) {
              console.error('Error updating equipment:', err);
              alert('Error updating equipment: ' + (err.message || 'Unknown error'));
            }
          }}
          existingEquipment={equipment}
          isEdit={true}
          businessId={equipment.company_id}
        />
      )}
    </PortalLayout>
  );
}