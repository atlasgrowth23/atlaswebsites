import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Estimate, EstimateStatusLabels } from '@/types/invoice';

export default function EstimatesPage() {
  const router = useRouter();
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Fetch estimates from the API
  useEffect(() => {
    async function fetchEstimates() {
      try {
        // Get business slug from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        setBusinessSlug(storedBusinessSlug);

        if (!storedBusinessSlug) {
          setIsLoading(false);
          return;
        }

        // Create demo estimates for initial preview
        const demoEstimates: Estimate[] = [
          {
            id: 1,
            company_id: 'demo-company',
            contact_id: 1,
            estimate_number: 'EST-1001',
            subtotal_amount: 1750.00,
            tax_amount: 140.00,
            total_amount: 1890.00,
            date_issued: '2023-05-15T10:30:00Z',
            date_expires: '2023-06-15T10:30:00Z',
            status: 'approved',
            contact: {
              name: 'John Smith',
              email: 'john.smith@example.com',
              phone: '(555) 123-4567'
            },
            job: {
              id: 1,
              description: 'AC Replacement'
            },
            created_at: '2023-05-15T10:30:00Z'
          },
          {
            id: 2,
            company_id: 'demo-company',
            contact_id: 2,
            estimate_number: 'EST-1002',
            subtotal_amount: 1200.00,
            discount_amount: 100.00,
            tax_amount: 88.00,
            total_amount: 1188.00,
            date_issued: '2023-05-20T14:45:00Z',
            date_expires: '2023-06-20T14:45:00Z',
            status: 'sent',
            contact: {
              name: 'Sarah Johnson',
              email: 'sarah.j@example.com',
              phone: '(555) 987-6543'
            },
            job: {
              id: 2,
              description: 'New Furnace Installation'
            },
            created_at: '2023-05-20T14:45:00Z'
          },
          {
            id: 3,
            company_id: 'demo-company',
            contact_id: 3,
            estimate_number: 'EST-1003',
            subtotal_amount: 350.00,
            tax_amount: 28.00,
            total_amount: 378.00,
            date_issued: '2023-05-25T09:15:00Z',
            date_expires: '2023-06-25T09:15:00Z',
            status: 'viewed',
            contact: {
              name: 'Mike Wilson',
              email: 'mike.w@example.com',
              phone: '(555) 555-5555'
            },
            job: {
              id: 3,
              description: 'Duct Cleaning Service'
            },
            created_at: '2023-05-25T09:15:00Z'
          },
          {
            id: 4,
            company_id: 'demo-company',
            contact_id: 4,
            estimate_number: 'EST-1004',
            subtotal_amount: 4800.00,
            tax_amount: 384.00,
            total_amount: 5184.00,
            date_issued: '2023-06-01T11:30:00Z',
            date_expires: '2023-07-01T11:30:00Z',
            status: 'draft',
            contact: {
              name: 'Emily Davis',
              email: 'emily.davis@example.com',
              phone: '(555) 444-3333'
            },
            job: {
              id: 4,
              description: 'Whole Home HVAC Installation'
            },
            created_at: '2023-06-01T11:30:00Z'
          },
          {
            id: 5,
            company_id: 'demo-company',
            contact_id: 5,
            estimate_number: 'EST-1005',
            subtotal_amount: 450.00,
            tax_amount: 36.00,
            total_amount: 486.00,
            date_issued: '2023-06-05T13:45:00Z',
            date_expires: '2023-06-05T13:45:00Z',
            status: 'expired',
            contact: {
              name: 'Robert Brown',
              email: 'robert.b@example.com',
              phone: '(555) 222-3333'
            },
            job: {
              id: 5,
              description: 'Seasonal Tune-Up Package'
            },
            created_at: '2023-06-05T13:45:00Z'
          }
        ];

        setEstimates(demoEstimates);
        setFilteredEstimates(demoEstimates);

        // Try to fetch from the API but don't block UI
        try {
          const response = await fetch(`/api/hvac/estimates?company_id=${storedBusinessSlug}`);
          const data = await response.json();
          
          if (data.success && data.estimates?.length > 0) {
            setEstimates(data.estimates);
            setFilteredEstimates(data.estimates);
          }
        } catch (apiError) {
          console.error('API error (non-blocking):', apiError);
        }

      } catch (err) {
        console.error('Error initializing estimates:', err);
        setError('Unable to load estimate data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchEstimates();
  }, []);

  // Filter estimates by status and search query
  useEffect(() => {
    let filtered = estimates;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(est => est.status === statusFilter);
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(est => 
        est.estimate_number?.toLowerCase().includes(query) ||
        est.contact?.name?.toLowerCase().includes(query) ||
        est.contact?.email?.toLowerCase().includes(query) ||
        String(est.total_amount).includes(query)
      );
    }
    
    setFilteredEstimates(filtered);
  }, [statusFilter, searchQuery, estimates]);

  // Format date for display
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle adding new estimate
  const handleCreateEstimate = () => {
    router.push('/hvacportal/estimates/create');
  };

  // Handle view estimate details
  const handleViewEstimate = (estimateId: number) => {
    router.push(`/hvacportal/estimates/${estimateId}`);
  };

  // Handle convert to invoice
  const handleConvertToInvoice = (estimateId: number) => {
    router.push(`/hvacportal/estimates/${estimateId}/convert`);
  };

  // Get status badge style
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'viewed':
        return 'bg-purple-100 text-purple-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-yellow-100 text-yellow-800';
      case 'converted':
        return 'bg-teal-100 text-teal-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get the business slug in the correct format for the PortalLayout
  const businessSlugProp = businessSlug === null ? undefined : businessSlug;

  return (
    <PortalLayout businessSlug={businessSlugProp}>
      <div className="space-y-6">
        {/* Header with search and filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estimates</h1>
            <p className="mt-1 text-sm text-gray-500">Create and manage customer estimates</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <Input
                type="text"
                placeholder="Search estimates..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
              onClick={handleCreateEstimate}
            >
              + Create Estimate
            </Button>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex overflow-x-auto pb-2 space-x-2">
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
              statusFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
            onClick={() => setStatusFilter('all')}
          >
            All Estimates
          </button>
          {Object.entries(EstimateStatusLabels).map(([status, label]) => (
            <button
              key={status}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                statusFilter === status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
              onClick={() => setStatusFilter(status)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Estimates List */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                <p className="mt-3 text-gray-500">Loading estimates...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : filteredEstimates.length === 0 ? (
            <EmptyEstimatesState onCreateEstimate={handleCreateEstimate} />
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimate #</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEstimates.map((estimate) => (
                    <tr key={estimate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <button 
                          onClick={() => handleViewEstimate(estimate.id!)}
                          className="hover:underline"
                        >
                          {estimate.estimate_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{estimate.contact?.name}</div>
                        <div className="text-xs text-gray-500">{estimate.contact?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(estimate.date_issued)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(estimate.date_expires)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(estimate.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(estimate.status)}`}>
                          {EstimateStatusLabels[estimate.status as keyof typeof EstimateStatusLabels] || estimate.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleViewEstimate(estimate.id!)}
                          className="text-blue-600 hover:text-blue-800 hover:underline mr-3"
                        >
                          View
                        </button>
                        
                        {estimate.status === 'draft' && (
                          <button 
                            onClick={() => router.push(`/hvacportal/estimates/${estimate.id}/edit`)}
                            className="text-gray-600 hover:text-gray-800 hover:underline mr-3"
                          >
                            Edit
                          </button>
                        )}
                        
                        {(estimate.status === 'approved' || estimate.status === 'viewed' || estimate.status === 'sent') && (
                          <button 
                            onClick={() => handleConvertToInvoice(estimate.id!)}
                            className="text-green-600 hover:text-green-800 hover:underline"
                          >
                            Convert
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}

// Empty state component
function EmptyEstimatesState({ onCreateEstimate }: { onCreateEstimate: () => void }) {
  return (
    <Card className="border border-dashed">
      <CardContent className="py-12">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No estimates found</h3>
          <p className="mt-2 text-gray-500">
            {`No estimates match your search criteria. Try adjusting your filters or create a new estimate.`}
          </p>
          <Button
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onCreateEstimate}
          >
            + Create Estimate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}