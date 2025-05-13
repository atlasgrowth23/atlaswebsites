import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { JobStatus, JobStatusLabels, JobPriority, JobPriorityLabels, JobType, JobTypeLabels } from '@/types/service';
import JobForm from '@/components/hvac/JobForm';

interface Job {
  id: number;
  company_id: string;
  customer_id: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  description: string;
  status: JobStatus;
  priority: JobPriority;
  job_type: JobType;
  scheduled_date: string;
  technician: string | null;
  created_at: string;
  updated_at: string | null;
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

export default function JobsPage() {
  const router = useRouter();
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch jobs from the API
  useEffect(() => {
    async function fetchJobs() {
      try {
        // Get business slug from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        setBusinessSlug(storedBusinessSlug);

        if (!storedBusinessSlug) {
          setIsLoading(false);
          return;
        }

        // Create demo jobs for initial preview
        const demoJobs: Job[] = [
          {
            id: 1,
            company_id: 'demo-company',
            customer_id: 1,
            customer_name: 'John Smith',
            customer_phone: '(555) 123-4567',
            customer_address: '123 Main St, Anytown, CA 12345',
            description: 'AC not cooling properly, making unusual noise when running',
            status: 'scheduled',
            priority: 'high',
            job_type: 'repair',
            scheduled_date: new Date().toISOString(),
            technician: 'Mike Johnson',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: null
          },
          {
            id: 2,
            company_id: 'demo-company',
            customer_id: 2,
            customer_name: 'Sarah Williams',
            customer_phone: '(555) 987-6543',
            customer_address: '456 Oak Ave, Springfield, IL 62701',
            description: 'Annual HVAC maintenance and filter replacement',
            status: 'completed',
            priority: 'medium',
            job_type: 'maintenance',
            scheduled_date: new Date(Date.now() - 172800000).toISOString(),
            technician: 'Chris Davis',
            created_at: new Date(Date.now() - 259200000).toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 3,
            company_id: 'demo-company',
            customer_id: 3,
            customer_name: 'Michael Rodriguez',
            customer_phone: '(555) 345-6789',
            customer_address: '789 Pine St, Riverdale, NY 10471',
            description: 'Furnace not turning on, possible ignition issue',
            status: 'in_progress',
            priority: 'emergency',
            job_type: 'repair',
            scheduled_date: new Date(Date.now() - 43200000).toISOString(),
            technician: 'Alex Wong',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 4,
            company_id: 'demo-company',
            customer_id: 4,
            customer_name: 'Emily Johnson',
            customer_phone: '(555) 555-1234',
            customer_address: '101 Maple Dr, Westview, CA 90210',
            description: 'New HVAC system installation consultation',
            status: 'scheduled',
            priority: 'medium',
            job_type: 'estimate',
            scheduled_date: new Date(Date.now() + 172800000).toISOString(),
            technician: null,
            created_at: new Date().toISOString(),
            updated_at: null
          },
          {
            id: 5,
            company_id: 'demo-company',
            customer_id: 5,
            customer_name: 'Robert Davis',
            customer_phone: '(555) 222-3333',
            customer_address: '222 Elm St, Lakeside, WA 98001',
            description: 'Thermostat replacement and programming',
            status: 'pending_parts',
            priority: 'low',
            job_type: 'repair',
            scheduled_date: new Date(Date.now() + 86400000).toISOString(),
            technician: 'Lisa Chen',
            created_at: new Date(Date.now() - 43200000).toISOString(),
            updated_at: new Date().toISOString()
          }
        ];

        setJobs(demoJobs);
        setFilteredJobs(demoJobs);

        // Try to fetch from the API but don't block UI
        try {
          const response = await fetch(`/api/hvac/jobs?company_id=${storedBusinessSlug}`);
          const data = await response.json();

          if (data.success && data.jobs?.length > 0) {
            setJobs(data.jobs);
            setFilteredJobs(data.jobs);
          }
        } catch (apiError) {
          console.error('API error (non-blocking):', apiError);
        }

      } catch (err) {
        console.error('Error initializing jobs:', err);
        setError('Unable to load jobs. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, []);

  // Filter jobs when status filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredJobs(jobs);
      return;
    }

    const filtered = jobs.filter(job => job.status === statusFilter);
    setFilteredJobs(filtered);
  }, [statusFilter, jobs]);

  // Format date to display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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

  // Handle creating a new job
  const handleCreateJob = () => {
    setShowCreateModal(true);
  };

  // Handle opening job details
  const handleViewJob = (jobId: number) => {
    router.push(`/hvacportal/jobs/${jobId}`);
  };

  // Handle saving a new job
  const handleSaveJob = async (jobData: JobFormData) => {
    try {
      // In a real implementation, this would save to the database via API
      // const response = await fetch('/api/hvac/jobs', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     ...jobData,
      //     company_id: businessSlug
      //   }),
      // });
      // const data = await response.json();

      // For demo, create a local job object
      const newJob: Job = {
        id: jobs.length > 0 ? Math.max(...jobs.map(j => j.id)) + 1 : 1,
        company_id: businessSlug || 'demo-company',
        customer_id: jobData.customer_id || 0,
        customer_name: jobData.customer_name || 'Unknown Customer',
        customer_phone: '(555) 555-5555', // Would come from customer data in a real implementation
        customer_address: 'Customer Address', // Would come from customer data in a real implementation
        description: jobData.description,
        status: jobData.status,
        priority: jobData.priority,
        job_type: jobData.job_type,
        scheduled_date: jobData.scheduled_date,
        technician: jobData.technician || null,
        created_at: new Date().toISOString(),
        updated_at: null
      };

      // Update state with the new job
      setJobs(prev => [newJob, ...prev]);

      // Close the create modal
      setShowCreateModal(false);

      // Show success message or notification (optional)
      alert('Job created successfully!');
    } catch (err: any) {
      console.error('Error creating job:', err);
      alert('Error creating job: ' + (err.message || 'Unknown error'));
    }
  };

  // Get the business slug in the correct format for the PortalLayout
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;

  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        {/* Header with filters and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Service Jobs</h1>
            <p className="mt-1 text-sm text-gray-500">Manage service jobs, appointments, and work orders</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`px-3 py-2 text-sm ${statusFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button
                className={`px-3 py-2 text-sm ${statusFilter === 'scheduled' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setStatusFilter('scheduled')}
              >
                Scheduled
              </button>
              <button
                className={`px-3 py-2 text-sm ${statusFilter === 'in_progress' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setStatusFilter('in_progress')}
              >
                In Progress
              </button>
              <button
                className={`px-3 py-2 text-sm ${statusFilter === 'pending_parts' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setStatusFilter('pending_parts')}
              >
                Pending
              </button>
              <button
                className={`px-3 py-2 text-sm ${statusFilter === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                onClick={() => setStatusFilter('completed')}
              >
                Completed
              </button>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md"
              onClick={handleCreateJob}
            >
              + New Job
            </Button>
          </div>
        </div>

        {/* Jobs List */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-t-2 border-blue-500 animate-spin"></div>
                <p className="mt-3 text-gray-500">Loading jobs...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyJobsState statusFilter={statusFilter} onCreateJob={handleCreateJob} />
          ) : (
            <div className="space-y-4">
              {filteredJobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={() => handleViewJob(job.id)}
                  formatDate={formatDate}
                  getStatusBadgeStyle={getStatusBadgeStyle}
                  getPriorityBadgeStyle={getPriorityBadgeStyle}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Job Creation Form Modal */}
      {showCreateModal && (
        <JobForm
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveJob}
          businessId={businessSlug || 'demo-company'}
        />
      )}
    </PortalLayout>
  );
}

// Empty state component
function EmptyJobsState({ statusFilter, onCreateJob }: { statusFilter: string, onCreateJob: () => void }) {
  return (
    <Card className="border border-dashed">
      <CardContent className="py-12">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            {statusFilter !== 'all'
              ? `No ${statusFilter} jobs found`
              : 'No jobs found'
            }
          </h3>
          <p className="mt-2 text-gray-500">
            {statusFilter !== 'all'
              ? `There are no jobs with status "${statusFilter}".`
              : 'Get started by creating your first service job.'
            }
          </p>
          <Button
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onCreateJob}
          >
            + Create New Job
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Job card component
function JobCard({
  job,
  onView,
  formatDate,
  getStatusBadgeStyle,
  getPriorityBadgeStyle
}: {
  job: Job,
  onView: () => void,
  formatDate: (date: string) => string,
  getStatusBadgeStyle: (status: JobStatus) => string,
  getPriorityBadgeStyle: (priority: JobPriority) => string
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onView}>
      <CardContent className="p-0">
        <div className="p-4 flex flex-wrap md:flex-nowrap gap-4">
          {/* Left section */}
          <div className="w-full md:w-2/3">
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">Job #{job.id}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadgeStyle(job.status)}`}>
                  {JobStatusLabels[job.status]}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${getPriorityBadgeStyle(job.priority)}`}>
                  {JobPriorityLabels[job.priority]}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                Created: {formatDate(job.created_at)}
              </div>
            </div>

            <h3 className="font-medium text-gray-900 mb-1">
              {JobTypeLabels[job.job_type]}: {job.description.length > 70 ? job.description.substring(0, 70) + '...' : job.description}
            </h3>

            <div className="mt-3 flex flex-wrap gap-y-2 text-sm">
              <div className="w-full md:w-1/2 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div>
                  <div className="font-medium">{job.customer_name}</div>
                  <div className="text-gray-500 text-xs">{job.customer_phone}</div>
                </div>
              </div>

              <div className="w-full md:w-1/2 flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="text-gray-500 text-xs leading-tight">
                  {job.customer_address}
                </div>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l border-gray-200 pl-0 md:pl-4 pt-3 md:pt-0 flex flex-col justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">Scheduled Date</div>
              <div className="font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(job.scheduled_date)}
              </div>
            </div>

            <div className="mt-3">
              <div className="text-sm text-gray-500 mb-1">Technician</div>
              <div className="font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.technician || 'Unassigned'}
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={(e) => { e.stopPropagation(); onView(); }} className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium">
                View Details →
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}