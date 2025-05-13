import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import PortalLayout from '@/components/portal/PortalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Invoice, InvoiceStatusLabels } from '@/types/invoice';

export default function InvoicesPage() {
  const router = useRouter();
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  // Fetch invoices from the API
  useEffect(() => {
    async function fetchInvoices() {
      try {
        // Get business slug from localStorage
        const storedBusinessSlug = localStorage.getItem('businessSlug');
        setBusinessSlug(storedBusinessSlug);

        if (!storedBusinessSlug) {
          setIsLoading(false);
          return;
        }

        // Create demo invoices for initial preview
        const demoInvoices: Invoice[] = [
          {
            id: 1,
            company_id: 'demo-company',
            contact_id: 1,
            invoice_number: 'INV-1001',
            subtotal_amount: 750.00,
            tax_amount: 60.00,
            total_amount: 810.00,
            date_issued: '2023-05-15T10:30:00Z',
            due_date: '2023-05-30T10:30:00Z',
            status: 'paid',
            contact: {
              name: 'John Smith',
              email: 'john.smith@example.com',
              phone: '(555) 123-4567'
            },
            job: {
              id: 1,
              description: 'AC Repair Service'
            },
            created_at: '2023-05-15T10:30:00Z'
          },
          {
            id: 2,
            company_id: 'demo-company',
            contact_id: 2,
            invoice_number: 'INV-1002',
            subtotal_amount: 1200.00,
            discount_amount: 100.00,
            tax_amount: 88.00,
            total_amount: 1188.00,
            date_issued: '2023-05-20T14:45:00Z',
            due_date: '2023-06-04T14:45:00Z',
            status: 'sent',
            contact: {
              name: 'Sarah Johnson',
              email: 'sarah.j@example.com',
              phone: '(555) 987-6543'
            },
            job: {
              id: 2,
              description: 'Annual HVAC Maintenance'
            },
            created_at: '2023-05-20T14:45:00Z'
          },
          {
            id: 3,
            company_id: 'demo-company',
            contact_id: 3,
            invoice_number: 'INV-1003',
            subtotal_amount: 3500.00,
            tax_amount: 280.00,
            total_amount: 3780.00,
            date_issued: '2023-05-25T09:15:00Z',
            due_date: '2023-06-09T09:15:00Z',
            status: 'partially_paid',
            contact: {
              name: 'Mike Wilson',
              email: 'mike.w@example.com',
              phone: '(555) 555-5555'
            },
            job: {
              id: 3,
              description: 'Thermostat Replacement'
            },
            created_at: '2023-05-25T09:15:00Z'
          },
          {
            id: 4,
            company_id: 'demo-company',
            contact_id: 4,
            invoice_number: 'INV-1004',
            subtotal_amount: 4800.00,
            tax_amount: 384.00,
            total_amount: 5184.00,
            date_issued: '2023-06-01T11:30:00Z',
            due_date: '2023-06-16T11:30:00Z',
            status: 'draft',
            contact: {
              name: 'Emily Davis',
              email: 'emily.davis@example.com',
              phone: '(555) 444-3333'
            },
            job: {
              id: 4,
              description: 'New AC Installation'
            },
            created_at: '2023-06-01T11:30:00Z'
          },
          {
            id: 5,
            company_id: 'demo-company',
            contact_id: 5,
            invoice_number: 'INV-1005',
            subtotal_amount: 250.00,
            tax_amount: 20.00,
            total_amount: 270.00,
            date_issued: '2023-06-05T13:45:00Z',
            due_date: '2023-06-20T13:45:00Z',
            status: 'overdue',
            contact: {
              name: 'Robert Brown',
              email: 'robert.b@example.com',
              phone: '(555) 222-3333'
            },
            job: {
              id: 5,
              description: 'Diagnostic Service'
            },
            created_at: '2023-06-05T13:45:00Z'
          }
        ];

        setInvoices(demoInvoices);
        setFilteredInvoices(demoInvoices);

        // Try to fetch from the API but don't block UI
        try {
          const response = await fetch(`/api/hvac/invoices?company_id=${storedBusinessSlug}`);
          const data = await response.json();
          
          if (data.success && data.invoices?.length > 0) {
            setInvoices(data.invoices);
            setFilteredInvoices(data.invoices);
          }
        } catch (apiError) {
          console.error('API error (non-blocking):', apiError);
        }

      } catch (err) {
        console.error('Error initializing invoices:', err);
        setError('Unable to load invoice data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  // Filter invoices by status and search query
  useEffect(() => {
    let filtered = invoices;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(inv => 
        inv.invoice_number?.toLowerCase().includes(query) ||
        inv.contact?.name?.toLowerCase().includes(query) ||
        inv.contact?.email?.toLowerCase().includes(query) ||
        String(inv.total_amount).includes(query)
      );
    }
    
    setFilteredInvoices(filtered);
  }, [statusFilter, searchQuery, invoices]);

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

  // Handle adding new invoice
  const handleCreateInvoice = () => {
    router.push('/hvacportal/invoices/create');
  };

  // Handle view invoice details
  const handleViewInvoice = (invoiceId: number) => {
    router.push(`/hvacportal/invoices/${invoiceId}`);
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
      case 'partially_paid':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'void':
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
            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
            <p className="mt-1 text-sm text-gray-500">Create and manage customer invoices</p>
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
                placeholder="Search invoices..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md"
              onClick={handleCreateInvoice}
            >
              + Create Invoice
            </Button>
          </div>
        </div>

        {/* Status filter tabs */}
        <div className="flex overflow-x-auto pb-2 space-x-2">
          <button
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${statusFilter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
            onClick={() => setStatusFilter('all')}
          >
            All Invoices
          </button>
          {Object.entries(InvoiceStatusLabels).map(([status, label]) => (
            <button
              key={status}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${statusFilter === status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              onClick={() => setStatusFilter(status)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Invoices List */}
        <div>
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full border-t-2 border-emerald-500 animate-spin"></div>
                <p className="mt-3 text-gray-500">Loading invoices...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-red-800">{error}</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <EmptyInvoicesState onCreateInvoice={handleCreateInvoice} />
          ) : (
            <div className="overflow-x-auto bg-white rounded-lg border">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        <button 
                          onClick={() => handleViewInvoice(invoice.id!)}
                          className="hover:underline"
                        >
                          {invoice.invoice_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{invoice.contact?.name}</div>
                        <div className="text-xs text-gray-500">{invoice.contact?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.date_issued)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(invoice.status)}`}>
                          {InvoiceStatusLabels[invoice.status as keyof typeof InvoiceStatusLabels] || invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => handleViewInvoice(invoice.id!)}
                          className="text-blue-600 hover:text-blue-800 hover:underline mr-4"
                        >
                          View
                        </button>
                        {invoice.status === 'draft' && (
                          <button 
                            onClick={() => router.push(`/hvacportal/invoices/${invoice.id}/edit`)}
                            className="text-gray-600 hover:text-gray-800 hover:underline"
                          >
                            Edit
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
function EmptyInvoicesState({ onCreateInvoice }: { onCreateInvoice: () => void }) {
  return (
    <Card className="border border-dashed">
      <CardContent className="py-12">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No invoices found</h3>
          <p className="mt-2 text-gray-500">
            {`No invoices match your search criteria. Try adjusting your filters or create a new invoice.`}
          </p>
          <Button
            className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={onCreateInvoice}
          >
            + Create Invoice
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}