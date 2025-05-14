import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { query } from '../../lib/db';

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
}

export default function SalesDashboard({ 
  pipelineStages, 
  salesUsers, 
  leads, 
  pipelineStats,
  currentUser
}: DashboardProps) {
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(leads);
  const [selectedStage, setSelectedStage] = useState<number | null>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);

  // Apply filters
  useEffect(() => {
    let result = [...leads];
    
    if (selectedStage !== null) {
      result = result.filter(lead => lead.stage_id === selectedStage);
    }
    
    if (selectedTerritory !== null && selectedTerritory !== 'All') {
      result = result.filter(lead => lead.state === selectedTerritory);
    }
    
    setFilteredLeads(result);
  }, [leads, selectedStage, selectedTerritory]);

  // Reset filters
  const resetFilters = () => {
    setSelectedStage(null);
    setSelectedTerritory(null);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
          user_id: currentUser.id,
          activity_type: 'call',
          description: 'Phone call to prospect'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to log call activity');
      }
      
      // Redirect to lead detail page
      window.location.href = `/sales/leads/${leadId}?call=active`;
      
    } catch (error) {
      console.error('Error tracking call:', error);
      alert('Failed to initiate call tracking. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Sales Dashboard</title>
      </Head>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Sales Dashboard</h1>
        <div className="flex space-x-4">
          <Link 
            href="/sales/calendar" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Calendar
          </Link>
          <Link 
            href="/sales/activity" 
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Activity Log
          </Link>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Pipeline Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {pipelineStats.map(stat => (
            <div 
              key={stat.stage_id}
              className="p-4 rounded-lg shadow"
              style={{ backgroundColor: stat.stage_color + '20', borderLeft: `4px solid ${stat.stage_color}` }}
            >
              <h3 className="font-semibold text-gray-700">{stat.stage_name}</h3>
              <p className="text-2xl font-bold">{stat.count}</p>
              <button 
                onClick={() => setSelectedStage(stat.stage_id)}
                className="text-sm text-blue-600 hover:underline"
              >
                View Leads
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pipeline Stage</label>
          <select 
            value={selectedStage || ''}
            onChange={(e) => setSelectedStage(e.target.value ? parseInt(e.target.value) : null)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">All Stages</option>
            {pipelineStages.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Territory</label>
          <select 
            value={selectedTerritory || ''}
            onChange={(e) => setSelectedTerritory(e.target.value || null)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">All Territories</option>
            <option value="Alabama">Alabama</option>
            <option value="Arkansas">Arkansas</option>
            <option value="Georgia">Georgia</option>
            <option value="Tennessee">Tennessee</option>
            <option value="Texas">Texas</option>
          </select>
        </div>
        
        <div className="ml-auto self-end">
          <button 
            onClick={resetFilters}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            Leads ({filteredLeads.length})
          </h2>
          <Link 
            href="/sales/leads/new"
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          >
            Add Lead
          </Link>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Contact
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Follow Up
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/sales/leads/${lead.id}`} className="text-blue-600 hover:underline">
                          {lead.company_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.city}, {lead.state}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                          style={{ backgroundColor: lead.stage_color + '20', color: lead.stage_color }}
                        >
                          {lead.stage_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.template_shared ? (
                          lead.template_viewed ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                              Viewed
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                              Shared
                            </span>
                          )
                        ) : (
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                            Not Shared
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.last_contact_date ? formatDate(lead.last_contact_date) : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.next_follow_up ? (
                          <span 
                            className={`${
                              new Date(lead.next_follow_up) < new Date() 
                                ? 'text-red-600' 
                                : 'text-gray-900'
                            }`}
                          >
                            {formatDate(lead.next_follow_up)}
                          </span>
                        ) : (
                          'Not Scheduled'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lead.assigned_to_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link href={`/sales/leads/${lead.id}`} className="text-blue-600 hover:text-blue-900">
                            View
                          </Link>
                          <button 
                            onClick={() => trackCall(lead.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Call
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No leads found matching the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // For now, we'll assume admin access - would need authentication logic in real app
    const currentUser = {
      id: 1,
      name: 'Admin User',
      email: 'admin@example.com',
      territory: 'All States',
      is_admin: true
    };
    
    // Get pipeline stages
    const stagesResult = await query('SELECT * FROM pipeline_stages ORDER BY order_num');
    const pipelineStages = stagesResult.rows;
    
    // Get sales users
    const usersResult = await query('SELECT * FROM sales_users ORDER BY name');
    const salesUsers = usersResult.rows;
    
    // Get leads with company and stage information
    const leadsQuery = `
      SELECT 
        sl.id, 
        sl.company_id,
        c.name as company_name,
        c.city,
        c.state,
        c.phone,
        sl.assigned_to,
        su.name as assigned_to_name,
        sl.stage_id,
        ps.name as stage_name,
        ps.color as stage_color,
        sl.template_shared,
        sl.template_viewed,
        sl.last_contact_date,
        sl.next_follow_up
      FROM sales_leads sl
      JOIN companies c ON sl.company_id = c.id
      LEFT JOIN pipeline_stages ps ON sl.stage_id = ps.id
      LEFT JOIN sales_users su ON sl.assigned_to = su.id
      ORDER BY 
        CASE WHEN sl.next_follow_up < NOW() THEN 0 ELSE 1 END,
        sl.next_follow_up ASC NULLS LAST,
        sl.updated_at DESC
      LIMIT 100
    `;
    
    const leadsResult = await query(leadsQuery);
    const leads = leadsResult.rows;
    
    // Get pipeline stats
    const statsQuery = `
      SELECT 
        ps.id as stage_id,
        ps.name as stage_name,
        ps.color as stage_color,
        COUNT(sl.id) as count
      FROM pipeline_stages ps
      LEFT JOIN sales_leads sl ON ps.id = sl.stage_id
      GROUP BY ps.id, ps.name, ps.color
      ORDER BY ps.order_num
    `;
    
    const statsResult = await query(statsQuery);
    const pipelineStats = statsResult.rows;
    
    return {
      props: {
        pipelineStages,
        salesUsers,
        leads,
        pipelineStats,
        currentUser
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      props: {
        pipelineStages: [],
        salesUsers: [],
        leads: [],
        pipelineStats: [],
        currentUser: null,
        error: 'Failed to load dashboard data'
      }
    };
  }
};