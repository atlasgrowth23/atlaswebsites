import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { query } from '../../lib/db';
import SalesLayout from '../../components/sales/Layout';
import LeadsTable from '../../components/sales/LeadsTable';

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
}

export default function SalesDashboard({ 
  pipelineStages, 
  salesUsers, 
  leads,
  pipelineStats,
  currentUser,
  totalLeads
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
        <title>Sales Dashboard</title>
      </Head>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Dashboard</h1>
        <p className="text-gray-600">
          Manage your pipeline, track leads, and schedule appointments.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <p className="text-2xl font-bold">{totalLeads}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">This Week's Calls</p>
              <p className="text-2xl font-bold">24</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Scheduled Appointments</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-full">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Deals Closing</p>
              <p className="text-2xl font-bold">3</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pipeline Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {pipelineStats.map(stat => (
            <div 
              key={stat.stage_id}
              className="bg-white rounded-lg shadow p-4 border-l-4 hover:shadow-md transition-shadow duration-200"
              style={{ borderLeftColor: stat.stage_color }}
            >
              <h3 className="font-medium text-gray-700">{stat.stage_name}</h3>
              <p className="text-2xl font-bold mt-2">{stat.count}</p>
              <button 
                onClick={() => setSelectedStage(stat.stage_id)}
                className="text-sm text-blue-600 hover:underline mt-2 inline-block"
              >
                View Leads
              </button>
            </div>
          ))}
        </div>
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
                className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
                className="mt-1 block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
              className="mt-1 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              View All Leads
            </Link>
          </div>
        </div>
        
        <LeadsTable leads={filteredLeads.slice(0, 10)} onTrackCall={trackCall} />
        
        {filteredLeads.length > 10 && (
          <div className="mt-4 text-center">
            <Link 
              href="/sales/leads"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              View All {filteredLeads.length} Leads
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/sales/leads/new"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Add New Lead
          </Link>
          
          <Link
            href="/sales/appointments/schedule"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Schedule Appointment
          </Link>
          
          <Link
            href="/sales/templates"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
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
      </div>
    </SalesLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Get query parameters for filtering
    const { user } = context.query;
    const userParam = typeof user === 'string' ? user : null;
    
    // Get all pipeline stages
    const stagesResult = await query(
      'SELECT id, name, order_num, color FROM pipeline_stages ORDER BY order_num ASC'
    );
    const pipelineStages = stagesResult.rows;
    
    // Get all sales users
    const usersResult = await query(
      'SELECT id, name, email, territory, is_admin FROM sales_users'
    );
    const salesUsers = usersResult.rows;
    
    // Determine current user (default to admin if not specified)
    let currentUser;
    if (userParam) {
      currentUser = salesUsers.find(u => u.name.toLowerCase() === userParam.toLowerCase());
    }
    
    if (!currentUser) {
      // Default to admin user
      currentUser = salesUsers.find(u => u.is_admin) || salesUsers[0];
    }
    
    // Filter condition for territory if not admin
    const territoryFilter = currentUser.is_admin 
      ? '' 
      : `WHERE c.state = '${currentUser.territory}'`;
    
    // Get leads with additional info
    let leadsQuery = `
      SELECT 
        l.id, 
        l.company_id, 
        c.name as company_name,
        c.city,
        c.state,
        c.phone,
        l.assigned_to,
        su.name as assigned_to_name,
        l.stage_id,
        ps.name as stage_name,
        ps.color as stage_color,
        l.template_shared,
        l.template_viewed,
        l.last_contact_date,
        l.next_follow_up
      FROM 
        leads l
      JOIN 
        companies c ON l.company_id = c.id
      LEFT JOIN 
        sales_users su ON l.assigned_to = su.id
      JOIN 
        pipeline_stages ps ON l.stage_id = ps.id
      ${territoryFilter}
      ORDER BY 
        l.next_follow_up ASC NULLS LAST,
        l.last_contact_date DESC NULLS LAST
      LIMIT 100
    `;
    
    const leadsResult = await query(leadsQuery);
    
    // Convert dates to ISO strings to make them serializable
    const leads = leadsResult.rows.map(lead => ({
      ...lead,
      last_contact_date: lead.last_contact_date ? lead.last_contact_date.toISOString() : null,
      next_follow_up: lead.next_follow_up ? lead.next_follow_up.toISOString() : null
    }));
    
    // Get total number of leads
    const totalLeadsQuery = `
      SELECT COUNT(*) as count FROM leads l
      JOIN companies c ON l.company_id = c.id
      ${territoryFilter}
    `;
    const totalLeadsResult = await query(totalLeadsQuery);
    const totalLeads = parseInt(totalLeadsResult.rows[0].count);
    
    // Get pipeline statistics
    let statsQuery = `
      SELECT 
        ps.id as stage_id, 
        ps.name as stage_name, 
        ps.color as stage_color,
        COUNT(l.id) as count
      FROM 
        pipeline_stages ps
      LEFT JOIN 
        leads l ON ps.id = l.stage_id
    `;
    
    // Add territory filter for non-admin users
    if (!currentUser.is_admin) {
      statsQuery += `
        LEFT JOIN companies c ON l.company_id = c.id
        WHERE c.state = '${currentUser.territory}' OR l.id IS NULL
      `;
    }
    
    statsQuery += `
      GROUP BY 
        ps.id, ps.name, ps.color, ps.order_num
      ORDER BY 
        ps.order_num
    `;
    
    const statsResult = await query(statsQuery);
    const pipelineStats = statsResult.rows;
    
    return {
      props: {
        pipelineStages,
        salesUsers,
        leads,
        pipelineStats,
        currentUser,
        totalLeads
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        pipelineStages: [],
        salesUsers: [],
        leads: [],
        pipelineStats: [],
        currentUser: { id: 1, name: 'Admin User', email: 'admin@example.com', territory: '', is_admin: true },
        totalLeads: 0
      },
    };
  }
};