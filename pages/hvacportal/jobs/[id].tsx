import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  JobStatus,
  JobStatusLabels,
  JobPriority,
  JobPriorityLabels,
  JobType,
  JobTypeLabels,
  ServiceRecord
} from '@/types/service';
import JobForm from '@/components/hvac/JobForm';

interface Job {
  id: number;
  company_id: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_city?: string;
  customer_state?: string;
  description: string;
  status: JobStatus;
  priority: JobPriority;
  job_type: JobType;
  scheduled_date: string;
  scheduled_time_start?: string | null;
  scheduled_time_end?: string | null;
  completion_date?: string | null;
  technician: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string | null;
  equipment_id?: number | null;
}

export default function JobDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState<JobStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchJobDetails() {
      if (!id) return;
      
      try {
        // Get business slug from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        setBusinessSlug(storedBusinessSlug);

        if (!storedBusinessSlug) {
          setIsLoading(false);
          return;
        }

        // Create a demo job for initial preview
        const demoJob: Job = {
          id: parseInt(id as string),
          company_id: 'demo-company',
          customer_id: 1,
          customer_name: 'John Smith',
          customer_phone: '(555) 123-4567',
          customer_address: '123 Main St',
          customer_city: 'Anytown',
          customer_state: 'CA',
          description: 'AC not cooling properly, making unusual noise when running. Customer reports the issue started yesterday afternoon.',
          status: 'scheduled',
          priority: 'high',
          job_type: 'repair',
          scheduled_date: new Date().toISOString(),
          scheduled_time_start: '09:00',
          scheduled_time_end: '11:00',
          technician: 'Mike Johnson',
          notes: 'Customer mentioned the unit is about 8 years old. Previous service was done by another company.',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: null,
          equipment_id: 2
        };

        // Create demo service records
        const demoServiceRecords: ServiceRecord[] = [
          {
            id: 1,
            job_id: parseInt(id as string),
            equipment_id: 2,
            company_id: 'demo-company',
            service_date: new Date(Date.now() - 86400000).toISOString(),
            service_type: 'Diagnostic inspection',
            technician: 'Mike Johnson',
            findings: 'Unit is low on refrigerant. Found small leak at the evaporator coil.',
            work_performed: 'Pressure tested system and confirmed leak location.',
            parts_used: null,
            recommendations: 'Recommend repairing the leak and recharging the system.',
            follow_up_required: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: null
          }
        ];

        setJob(demoJob);
        setServiceRecords(demoServiceRecords);
        if (demoJob.status) {
          setUpdatedStatus(demoJob.status);
        }

        // Try to fetch from the API but don't block UI
        try {
          const response = await fetch(`/api/hvac/jobs?company_id=${storedBusinessSlug}&id=${id}`);
          const data = await response.json();
          
          if (data.success && data.job) {
            setJob(data.job);
            if (data.job.status) {
              setUpdatedStatus(data.job.status);
            }
            
            // Fetch service records for this job
            const serviceResponse = await fetch(`/api/hvac/service-records?company_id=${storedBusinessSlug}&job_id=${id}`);
            const serviceData = await serviceResponse.json();
            
            if (serviceData.success && serviceData.records) {
              setServiceRecords(serviceData.records);
            }
          }
        } catch (apiError) {
          console.error('API error (non-blocking):', apiError);
        }

      } catch (err) {
        console.error('Error fetching job details:', err);
        setError('Unable to load job details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobDetails();
  }, [id]);

  // Format date to display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time to display
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '';
    
    // Handle different time formats (HH:MM or ISO string)
    if (timeString.includes('T')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    }
    
    // Handle HH:MM format
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    });
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!job || !updatedStatus || updatedStatus === job.status) return;
    
    setIsSaving(true);

    try {
      // In a real implementation, this would call the API
      // await fetch(`/api/hvac/job-status`, {
      //   method: 'PUT',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     id: job.id,
      //     company_id: job.company_id,
      //     status: updatedStatus
      //   }),
      // });

      // Update the local job object
      setJob(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: updatedStatus,
          updated_at: new Date().toISOString()
        };
      });

      // Add completion date if status is completed
      if (updatedStatus === 'completed') {
        setJob(prev => {
          if (!prev) return null;
          return {
            ...prev,
            completion_date: new Date().toISOString()
          };
        });
      }

      setIsEditingStatus(false);
    } catch (err) {
      console.error('Error updating job status:', err);
      setError('Failed to update job status. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Get style for priority badge
  const getPriorityBadgeStyle = (priority: JobPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get style for status badge
  const getStatusBadgeStyle = (status: JobStatus) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending_parts':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the business slug in the correct format for the PortalLayout
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;

  if (isLoading) {
    return (
      <PortalLayout businessSlug={businessSlugProp}>
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 rounded-full border-t-2 border-blue-500 animate-spin"></div>
            <p className="mt-3 text-gray-500">Loading job details...</p>
          </div>
        </div>
      </PortalLayout>
    );
  }

  if (error || !job) {
    return (
      <PortalLayout businessSlug={businessSlugProp}>
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-800">{error || 'Job not found'}</p>
          <Link href="/hvacportal/jobs">
            <button className="mt-4 text-blue-600 hover:text-blue-800 hover:underline">
              &larr; Back to Jobs
            </button>
          </Link>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        {/* Header with back link and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pb-6 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/hvacportal/jobs">
                <button className="text-blue-600 hover:text-blue-800 hover:underline">
                  &larr; Back to Jobs
                </button>
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">Job #{job.id}</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">{JobTypeLabels[job.job_type]} Job</h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-blue-600 text-blue-700 hover:bg-blue-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Job
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Create Invoice
            </Button>
          </div>
        </div>

        {/* Main job details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-medium">Job Details</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadgeStyle(job.priority)}`}>
                      {JobPriorityLabels[job.priority]}
                    </span>
                    {isEditingStatus ? (
                      <div className="flex items-center gap-1">
                        <select
                          value={updatedStatus || ''}
                          onChange={(e) => setUpdatedStatus(e.target.value as JobStatus)}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1"
                        >
                          {Object.entries(JobStatusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <Button 
                          size="sm" 
                          onClick={handleStatusUpdate}
                          disabled={isSaving || !updatedStatus || updatedStatus === job.status}
                          className="h-7 px-2 py-0 bg-green-600 hover:bg-green-700 text-white"
                        >
                          {isSaving ? '...' : 'Save'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditingStatus(false);
                            setUpdatedStatus(job.status);
                          }}
                          className="h-7 px-2 py-0"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(job.status)}`}>
                          {JobStatusLabels[job.status]}
                        </span>
                        <button 
                          onClick={() => setIsEditingStatus(true)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          Change
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-800">{job.description}</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Scheduled Date</h3>
                    <p className="text-gray-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(job.scheduled_date)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Scheduled Time</h3>
                    <p className="text-gray-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {job.scheduled_time_start ? (
                        `${formatTime(job.scheduled_time_start)} - ${formatTime(job.scheduled_time_end) || 'End time not set'}`
                      ) : 'No time specified'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Job Type</h3>
                    <p className="text-gray-800">{JobTypeLabels[job.job_type]}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned Technician</h3>
                    <p className="text-gray-800 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {job.technician || 'Unassigned'}
                    </p>
                  </div>
                </div>
                
                {job.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Notes</h3>
                    <p className="text-gray-700 text-sm">{job.notes}</p>
                  </div>
                )}

                {job.completion_date && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Completion Date</h3>
                    <p className="text-gray-800">{formatDate(job.completion_date)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Service Records Section */}
            <Card className="mt-6">
              <CardHeader className="border-b border-gray-100 pb-4 flex flex-row justify-between">
                <CardTitle className="text-lg font-medium">Service Records</CardTitle>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  + Add Service Record
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                {serviceRecords.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No service records have been added to this job yet.</p>
                    <Button
                      className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      + Create Service Record
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {serviceRecords.map((record) => (
                      <div 
                        key={record.id} 
                        className="border border-gray-200 rounded-md p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{record.service_type}</h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(record.service_date)} • Technician: {record.technician || 'Not specified'}
                            </p>
                          </div>
                          <button className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                            View Details
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Customer card */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-medium">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-medium mr-3">
                    {job.customer_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{job.customer_name}</h3>
                    <p className="text-sm text-gray-500">Customer #{job.customer_id}</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-gray-900">{job.customer_phone}</p>
                      <button className="text-blue-600 hover:text-blue-800 text-xs">Call Customer</button>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-gray-900">{job.customer_address}</p>
                      {job.customer_city && job.customer_state && (
                        <p className="text-gray-500 text-sm">{job.customer_city}, {job.customer_state}</p>
                      )}
                      <button className="text-blue-600 hover:text-blue-800 text-xs">View on Map</button>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 mt-3 border-t border-gray-100 flex justify-between">
                  <Link href={`/hvacportal/contacts/${job.customer_id}`}>
                    <button className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                      View Full Profile
                    </button>
                  </Link>
                  <button className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                    Message Customer
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Equipment card - only show if we have an equipment_id */}
            {job.equipment_id && (
              <Card>
                <CardHeader className="border-b border-gray-100 pb-4">
                  <CardTitle className="text-lg font-medium">Equipment Information</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Equipment Type</h3>
                      <p className="text-gray-900">Air Conditioner</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Make/Model</h3>
                      <p className="text-gray-900">Carrier Infinity 26</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Serial Number</h3>
                      <p className="text-gray-900">AC298374662</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Installation Date</h3>
                      <p className="text-gray-900">May 15, 2020</p>
                    </div>
                    
                    <div className="pt-2 mt-3 border-t border-gray-100">
                      <Link href={`/hvacportal/equipment/${job.equipment_id}`}>
                        <button className="text-blue-600 hover:text-blue-800 hover:underline text-sm">
                          View Equipment Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions Card */}
            <Card>
              <CardHeader className="border-b border-gray-100 pb-4">
                <CardTitle className="text-lg font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Create Invoice</span>
                  </button>
                  
                  <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Add Service Record</span>
                  </button>
                  
                  <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Reschedule Job</span>
                  </button>
                  
                  <button className="w-full flex items-center p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel Job</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}