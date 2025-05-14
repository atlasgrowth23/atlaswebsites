import { useState } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { query } from '../../../lib/db';
import SalesLayout from '../../../components/sales/Layout';
import LeadsTable from '../../../components/sales/LeadsTable';
import SalesTabs from '../../../components/sales/SalesTabs';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../../../components/ui/card';
import { fetchSalesData } from '../../../lib/sales-data';

// Types
interface PipelineStage {
  id: number;
  name: string;
  order_num: number;
  color: string;
}

interface SalesUser {
  id: number;
  name: string;
  email: string;
  territory: string;
  is_admin: boolean;
}

interface Lead {
  id: number;
  company_id: string;
  company_name: string;
  city: string;
  state: string;
  phone: string;
  assigned_to: number;
  assigned_to_name: string;
  stage_id: number;
  stage_name: string;
  stage_color: string;
  template_shared: boolean;
  template_viewed: boolean;
  last_contact_date: string | null;
  next_follow_up: string | null;
}

interface LeadsProps {
  pipelineStages: PipelineStage[];
  salesUsers: SalesUser[];
  leads: Lead[];
  currentUser: SalesUser;
  totalLeads: number;
  page: number;
  totalPages: number;
}

export default function LeadsPage({ 
  pipelineStages, 
  salesUsers, 
  leads,
  currentUser,
  totalLeads,
  page,
  totalPages
}: LeadsProps) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(page);
  
  // Filter leads based on selection
  const filteredLeads = leads.filter(lead => {
    // Filter by pipeline stage if selected
    if (selectedStage && lead.stage_id !== selectedStage) {
      return false;
    }
    
    // Filter by territory if selected
    if (selectedTerritory && lead.state !== selectedTerritory) {
      return false;
    }

    // Filter by assignee if selected
    if (selectedAssignee && lead.assigned_to !== selectedAssignee) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Reset filters
  const resetFilters = () => {
    setSelectedStage(null);
    setSelectedTerritory(null);
    setSelectedAssignee(null);
    setSearchTerm('');
  };
  
  // Track call activity
  const trackCall = async (leadId: number) => {
    try {
      const response = await fetch('/api/sales/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: leadId,
          activity_type: 'call',
          user_id: currentUser.id,
          notes: 'Call initiated from leads page',
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to track call activity');
      }
      
    } catch (error) {
      console.error('Error tracking call:', error);
      alert('Failed to initiate call tracking. Please try again.');
    }
  };

  return (
    <SalesLayout currentUser={currentUser}>
      <Head>
        <title>{`Leads Management | HVAC Sales`}</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Leads Management</h1>
        <p className="text-gray-600">
          Viewing all {totalLeads} leads. Use filters to narrow down results.
        </p>
      </div>
      
      <SalesTabs activeTab="leads" />

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Companies
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Company name..."
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            
            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                Pipeline Stage
              </label>
              <select 
                id="stage"
                value={selectedStage || ''}
                onChange={(e) => setSelectedStage(e.target.value ? parseInt(e.target.value) : null)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="">All Stages</option>
                {pipelineStages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="territory" className="block text-sm font-medium text-gray-700 mb-1">
                Territory
              </label>
              <select 
                id="territory"
                value={selectedTerritory || ''}
                onChange={(e) => setSelectedTerritory(e.target.value || null)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="">All Territories</option>
                <option value="Alabama">Alabama</option>
                <option value="Arkansas">Arkansas</option>
                <option value="Georgia">Georgia</option>
                <option value="Tennessee">Tennessee</option>
                <option value="Texas">Texas</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select 
                id="assignee"
                value={selectedAssignee || ''}
                onChange={(e) => setSelectedAssignee(e.target.value ? parseInt(e.target.value) : null)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
              >
                <option value="">All Sales Reps</option>
                {salesUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={resetFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none mr-4"
            >
              Reset Filters
            </button>
            <button 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none"
            >
              Apply Filters
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card className="mb-8">
        <CardHeader className="border-b border-gray-200">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium text-gray-900">
              All Leads 
              {(selectedStage || selectedTerritory || selectedAssignee || searchTerm) && (
                <span className="text-sm font-normal text-gray-500 ml-2">(Filtered)</span>
              )}
            </CardTitle>
            <div>
              <span className="text-sm text-gray-500">
                Showing {filteredLeads.length > 0 ? 1 : 0}-{Math.min(filteredLeads.length, 100)} of {filteredLeads.length} leads
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <LeadsTable leads={filteredLeads} onTrackCall={trackCall} />
        </CardContent>
        
        {/* Pagination */}
        <CardFooter className="px-6 py-4 border-t border-gray-200">
          <div className="w-full flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{filteredLeads.length > 0 ? (currentPage - 1) * 50 + 1 : 0}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * 50, totalLeads)}</span> of{' '}
                <span className="font-medium">{totalLeads}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= totalPages - 2 
                      ? totalPages - 4 + i 
                      : currentPage - 2 + i;
                      
                  if (pageNum <= 0 || pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-primary/10 border-primary text-primary'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </CardFooter>
      </Card>
      
    </SalesLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get query parameters
    const { page = '1', stage, territory, assignee, search, user } = context.query;
    const currentPage = parseInt(page as string) || 1;
    const userParam = typeof user === 'string' ? user : null;
    
    // Fetch all data using our utility function
    const data = await fetchSalesData('leads');
    
    // Apply any additional filters from query parameters
    let filteredLeads = Array.isArray(data.leads) ? [...data.leads] : [];
    
    if (stage) {
      const stageId = parseInt(stage as string);
      filteredLeads = filteredLeads.filter(lead => lead.stage_id === stageId);
    }
    
    if (territory) {
      filteredLeads = filteredLeads.filter(lead => lead.state === territory);
    }
    
    if (assignee) {
      const assigneeId = parseInt(assignee as string);
      filteredLeads = filteredLeads.filter(lead => lead.assigned_to === assigneeId);
    }
    
    if (search) {
      const searchQuery = (search as string).toLowerCase();
      filteredLeads = filteredLeads.filter(lead => 
        lead.company_name.toLowerCase().includes(searchQuery)
      );
    }
    
    // If a specific user was requested, find and use that user
    if (userParam && data.salesUsers) {
      const requestedUser = data.salesUsers.find(u => u.name.toLowerCase() === userParam.toLowerCase());
      if (requestedUser) {
        data.currentUser = requestedUser;
        
        // Filter leads by territory if non-admin user
        if (!requestedUser.is_admin && requestedUser.territory) {
          filteredLeads = filteredLeads.filter(lead => lead.state === requestedUser.territory);
        }
      }
    }
    
    // Update the total leads count based on filters
    const totalLeads = filteredLeads.length;
    const totalPages = Math.ceil(totalLeads / 100);
    
    // Apply pagination
    const pageSize = 100;
    const offset = (currentPage - 1) * pageSize;
    filteredLeads = filteredLeads.slice(offset, offset + pageSize);
    
    return {
      props: {
        ...data,
        leads: filteredLeads,
        totalLeads,
        page: currentPage,
        totalPages
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        pipelineStages: [],
        salesUsers: [],
        leads: [],
        currentUser: { id: 1, name: 'Admin User', email: 'admin@example.com', territory: '', is_admin: true },
        totalLeads: 0,
        page: 1,
        totalPages: 1
      },
    };
  }
};