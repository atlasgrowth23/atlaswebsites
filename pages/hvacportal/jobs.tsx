import React, { useEffect, useState } from 'react';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Job {
  id: number;
  customer: string;
  address: string;
  phoneNumber: string;
  description: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  scheduledDate: string;
  technician: string;
  jobType: string;
  createdAt: string;
}

export default function JobsPage() {
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sample jobs data - would come from an API in production
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: 1001,
      customer: 'John Smith',
      address: '123 Main St, Springfield, IL',
      phoneNumber: '(555) 123-4567',
      description: 'AC not cooling properly, making strange noise',
      status: 'scheduled',
      priority: 'high',
      scheduledDate: '2025-05-15T10:00:00',
      technician: 'Mike Johnson',
      jobType: 'Repair',
      createdAt: '2025-05-10T14:23:00'
    },
    {
      id: 1002,
      customer: 'Sarah Williams',
      address: '456 Oak Dr, Springfield, IL',
      phoneNumber: '(555) 987-6543',
      description: 'Annual maintenance for HVAC system',
      status: 'completed',
      priority: 'medium',
      scheduledDate: '2025-05-11T13:30:00',
      technician: 'Robert Davis',
      jobType: 'Maintenance',
      createdAt: '2025-05-08T09:15:00'
    },
    {
      id: 1003,
      customer: 'Michael Brown',
      address: '789 Pine Ave, Springfield, IL',
      phoneNumber: '(555) 555-5555',
      description: 'New furnace installation',
      status: 'in-progress',
      priority: 'medium',
      scheduledDate: '2025-05-12T09:00:00',
      technician: 'James Wilson',
      jobType: 'Installation',
      createdAt: '2025-05-07T16:45:00'
    },
    {
      id: 1004,
      customer: 'Emily Johnson',
      address: '321 Maple Rd, Springfield, IL',
      phoneNumber: '(555) 333-2222',
      description: 'Thermostat not working, needs replacement',
      status: 'scheduled',
      priority: 'low',
      scheduledDate: '2025-05-16T15:30:00',
      technician: 'Mike Johnson',
      jobType: 'Repair',
      createdAt: '2025-05-11T11:10:00'
    },
    {
      id: 1005,
      customer: 'David Miller',
      address: '567 Cherry Ln, Springfield, IL',
      phoneNumber: '(555) 777-8888',
      description: 'Emergency - No heat, possibly broken furnace',
      status: 'in-progress',
      priority: 'emergency',
      scheduledDate: '2025-05-12T08:00:00',
      technician: 'Robert Davis',
      jobType: 'Emergency',
      createdAt: '2025-05-12T07:30:00'
    }
  ]);

  useEffect(() => {
    // In production, this would fetch actual data from an API
    const storedBusinessSlug = localStorage.getItem('businessSlug');
    setBusinessSlug(storedBusinessSlug);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  // Filter jobs based on active tab and search query
  const filteredJobs = jobs.filter(job => {
    // First filter by tab
    if (activeTab !== 'all' && job.status !== activeTab) return false;
    
    // Then filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        job.customer.toLowerCase().includes(query) ||
        job.address.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query) ||
        job.jobType.toLowerCase().includes(query) ||
        job.id.toString().includes(query)
      );
    }
    
    return true;
  });

  // Get the business slug in the correct format for the PortalLayout
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch(priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'emergency':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Job Management</h1>
            <p className="text-gray-500">Manage all your service jobs in one place</p>
          </div>
          <div>
            <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">
              + Create New Job
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeTab === 'all' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Jobs
            </button>
            <button 
              onClick={() => setActiveTab('scheduled')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeTab === 'scheduled' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Scheduled
            </button>
            <button 
              onClick={() => setActiveTab('in-progress')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeTab === 'in-progress' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              In Progress
            </button>
            <button 
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${activeTab === 'completed' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Completed
            </button>
          </div>
          <div>
            <div className="relative">
              <input
                type="text"
                className="w-full border rounded-md py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search jobs by customer, address, or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="border border-dashed">
              <CardContent className="py-12">
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium">No jobs found</h3>
                  <p className="mt-2 text-gray-500">Try adjusting your filters or search query.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="p-4 pb-2 md:p-6 md:pb-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{job.customer}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadgeClass(job.priority)}`}>
                              {job.priority.charAt(0).toUpperCase() + job.priority.slice(1)}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(job.status)}`}>
                              {job.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </span>
                          </div>
                          <p className="text-gray-500 text-sm">
                            Job #{job.id} • {job.jobType} • {new Date(job.scheduledDate).toLocaleDateString()} • {job.technician}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm">{job.description}</p>
                      <div className="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1 text-gray-500">
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {job.address}
                        </span>
                        <span className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          {job.phoneNumber}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 md:px-6 md:py-3 rounded-b-lg flex justify-between items-center">
                      <div className="text-xs">
                        Created: {new Date(job.createdAt).toLocaleString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                          Schedule
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                          Invoice
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">
                          Complete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}