import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { format } from 'date-fns';
import { query } from '../../lib/db';
import SalesLayout from '../../components/sales/Layout';
import LeadsTable from '../../components/sales/LeadsTable';
import SalesTabs from '../../components/sales/SalesTabs';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { fetchSalesData } from '../../lib/sales-data';

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

interface PipelineStats {
  stage_id: number;
  stage_name: string;
  count: number;
  stage_color: string;
}

interface DashboardProps {
  pipelineStages: PipelineStage[];
  salesUsers: SalesUser[];
  leads: Lead[];
  pipelineStats: PipelineStats[];
  currentUser: SalesUser;
  totalLeads: number;
  upcomingAppointments: Array<{
    id: number;
    lead_id: number;
    company_name: string;
    appointment_date: string;
    title: string;
  }>;
}

export default function SalesDashboard({ 
  pipelineStages, 
  salesUsers, 
  leads,
  pipelineStats,
  currentUser,
  totalLeads,
  upcomingAppointments
}: DashboardProps) {
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  
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
    
    return true;
  });
  
  // Reset filters
  const resetFilters = () => {
    setSelectedStage(null);
    setSelectedTerritory(null);
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
          notes: 'Call initiated from dashboard',
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
        <title>{`Sales Dashboard`}</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Dashboard</h1>
        <p className="text-gray-600">
          Manage your pipeline, track leads, and schedule appointments.
        </p>
      </div>
      
      <SalesTabs activeTab="dashboard" />

      {/* Territory-Based Dashboard Summary */}
      <div className="grid grid-cols-1 gap-5 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {currentUser.is_admin ? 'Total HVAC Companies' : 'Arkansas HVAC Companies'}
                </p>
                <p className="text-2xl font-bold">
                  {currentUser.is_admin ? totalLeads : leads.filter(lead => lead.state === 'AR').length}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pipeline Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {pipelineStats.map(stat => (
            <Card 
              key={stat.stage_id}
              className="overflow-hidden border-l-4 hover:shadow-md transition-shadow duration-200"
              style={{ borderLeftColor: stat.stage_color }}
            >
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-700">{stat.stage_name}</h3>
                <p className="text-2xl font-bold mt-2">{stat.count}</p>
                <button 
                  onClick={() => setSelectedStage(stat.stage_id)}
                  className="text-sm text-primary hover:underline mt-2 inline-block"
                >
                  View Leads
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Appointments</h2>
          <Link href="/sales/appointments" className="text-sm text-primary hover:underline">
            View All
          </Link>
        </div>
        
        <Card className="overflow-hidden">
          {upcomingAppointments.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {upcomingAppointments.map(appointment => (
                <div key={appointment.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <Link href={`/sales/leads/${appointment.lead_id}`} className="font-medium text-primary hover:underline">
                        {appointment.company_name}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">{appointment.title}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {'Scheduled: ' + appointment.appointment_date.substring(0, 10)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CardContent className="text-center text-gray-500">
              No upcoming appointments
            </CardContent>
          )}
        </Card>
      </div>

      {/* Recent Leads */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Recent Leads
            {(selectedStage || selectedTerritory) && (
              <span className="text-sm font-normal text-gray-500 ml-2">(Filtered)</span>
            )}
          </h2>
          
          <div className="flex space-x-4">
            <div>
              <select 
                value={selectedStage || ''}
                onChange={(e) => setSelectedStage(e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">All Stages</option>
                {pipelineStages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select 
                value={selectedTerritory || ''}
                onChange={(e) => setSelectedTerritory(e.target.value || null)}
                className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
              >
                <option value="">All Territories</option>
                <option value="Alabama">Alabama</option>
                <option value="Arkansas">Arkansas</option>
                <option value="Georgia">Georgia</option>
                <option value="Tennessee">Tennessee</option>
                <option value="Texas">Texas</option>
              </select>
            </div>
            
            {(selectedStage || selectedTerritory) && (
              <button 
                onClick={resetFilters}
                className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Reset
              </button>
            )}
            
            <Link
              href="/sales/leads"
              className="mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none"
            >
              View All Leads
            </Link>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <LeadsTable leads={filteredLeads.slice(0, 10)} onTrackCall={trackCall} />
          
            {filteredLeads.length > 10 && (
              <div className="p-4 text-center border-t border-gray-200">
                <Link 
                  href="/sales/leads"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View All {filteredLeads.length} Leads
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href="/sales/leads/new"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              Add New Lead
            </Link>
            
            <Link
              href="/sales/appointments/schedule"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
            >
              Schedule Appointment
            </Link>
            
            <Link
              href="/sales/templates"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent hover:bg-accent/90"
            >
              Browse Templates
            </Link>
            
            <Link
              href="/sales/reports"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
            >
              View Reports
            </Link>
          </div>
        </CardContent>
      </Card>
    </SalesLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get query parameters 
    const { user } = context.query;
    const userParam = typeof user === 'string' ? user : null;
    const activeTab = 'dashboard'; // Dashboard is default for /sales
    
    // Fetch all data server-side
    const data = await fetchSalesData(activeTab);
    
    // If a specific user was requested, find and use that user
    if (userParam && data.salesUsers) {
      const requestedUser = data.salesUsers.find(u => u.name.toLowerCase() === userParam.toLowerCase());
      if (requestedUser) {
        data.currentUser = requestedUser;
      }
    }
    
    return {
      props: data,
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        pipelineStages: [],
        salesUsers: [],
        leads: [],
        pipelineStats: [],
        currentUser: { id: 1, name: 'Admin User', email: 'admin@example.com', territory: '', is_admin: true },
        totalLeads: 0,
        upcomingAppointments: []
      },
    };
  }
};