import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { GetServerSideProps } from 'next';
import { query } from '../../lib/db';
import styles from '../../styles/sales-dashboard.module.css';

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

  // Get template URL
  const getTemplateUrl = (company: string) => {
    return `/t/moderntrust/${company.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
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
    <div className={styles.salesDashboard}>
      <Head>
        <title>Sales Pipeline</title>
      </Head>

      <div className={styles.dashboardHeader}>
        <h1 className={styles.dashboardTitle}>HVAC Sales Pipeline</h1>
        <div className="flex space-x-4">
          <Link 
            href="/"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Main Site
          </Link>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className={styles.pipelineStats}>
        {pipelineStats.map(stat => (
          <div 
            key={stat.stage_id}
            className={styles.statCard}
          >
            <div className={styles.statCardColorBar} style={{backgroundColor: stat.stage_color}}></div>
            <h3 className={styles.statName}>{stat.stage_name}</h3>
            <p className={styles.statValue}>{stat.count}</p>
            <button 
              onClick={() => setSelectedStage(stat.stage_id)}
              className={styles.statAction}
            >
              View Leads
            </button>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Pipeline Stage</label>
          <select 
            value={selectedStage || ''}
            onChange={(e) => setSelectedStage(e.target.value ? parseInt(e.target.value) : null)}
            className={styles.filterControl}
          >
            <option value="">All Stages</option>
            {pipelineStages.map(stage => (
              <option key={stage.id} value={stage.id}>{stage.name}</option>
            ))}
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Territory</label>
          <select 
            value={selectedTerritory || ''}
            onChange={(e) => setSelectedTerritory(e.target.value || null)}
            className={styles.filterControl}
          >
            <option value="">All Territories</option>
            <option value="Alabama">Alabama</option>
            <option value="Arkansas">Arkansas</option>
            <option value="Georgia">Georgia</option>
            <option value="Tennessee">Tennessee</option>
            <option value="Texas">Texas</option>
          </select>
        </div>
        
        <div className={styles.filterActions}>
          <button 
            onClick={resetFilters}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className={styles.leadsTableContainer}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            HVAC Businesses ({filteredLeads.length})
          </h2>
          <div>
            {currentUser.is_admin && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded">
                Admin View
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className={styles.leadsTable}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Company</th>
                <th>Location</th>
                <th>Status</th>
                <th>Template</th>
                <th>Last Contact</th>
                <th>Next Follow-up</th>
                <th>Assigned To</th>
                <th style={{textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className={styles.tableRow}>
                    <td>
                      <Link href={`/sales/leads/${lead.id}`} className={styles.companyName}>
                        {lead.company_name}
                      </Link>
                    </td>
                    <td>
                      {lead.city || 'N/A'}, {lead.state || 'N/A'}
                    </td>
                    <td>
                      <span 
                        className={styles.badge}
                        style={{ backgroundColor: lead.stage_color + '20', color: lead.stage_color }}
                      >
                        {lead.stage_name}
                      </span>
                    </td>
                    <td>
                      {lead.template_shared ? (
                        lead.template_viewed ? (
                          <span className={`${styles.badge} ${styles.badgeViewed}`}>
                            Viewed
                          </span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeShared}`}>
                            Shared
                          </span>
                        )
                      ) : (
                        <Link 
                          href={getTemplateUrl(lead.company_name)} 
                          target="_blank"
                          className={`${styles.badge} ${styles.badgePreview}`}
                        >
                          Preview
                        </Link>
                      )}
                    </td>
                    <td>
                      {lead.last_contact_date ? formatDate(lead.last_contact_date) : 'Never'}
                    </td>
                    <td>
                      {lead.next_follow_up ? (
                        <span className={new Date(lead.next_follow_up) < new Date() ? styles.dateOverdue : ''}>
                          {formatDate(lead.next_follow_up)}
                        </span>
                      ) : (
                        'Not Scheduled'
                      )}
                    </td>
                    <td>
                      {lead.assigned_to_name || 'Unassigned'}
                    </td>
                    <td>
                      <div className={styles.tableActions}>
                        <Link 
                          href={`tel:${lead.phone}`} 
                          className={styles.callLink}
                          onClick={() => trackCall(lead.id)}
                        >
                          Call
                        </Link>
                        <Link href={`/sales/leads/${lead.id}`} className={styles.actionLink}>
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className={styles.tableRow}>
                  <td colSpan={8} style={{textAlign: 'center'}}>
                    No leads found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Check if request is from Jared or Admin based on query params
    // In a real app, this would be based on authentication
    const { user } = context.query;
    const isJared = user === 'jared';
    
    const currentUser = {
      id: isJared ? 2 : 1,
      name: isJared ? 'Jared' : 'Admin User',
      email: isJared ? 'jared@example.com' : 'admin@example.com',
      territory: isJared ? 'Arkansas' : 'All States',
      is_admin: !isJared
    };
    
    // Get pipeline stages (only the fields we need)
    const stagesResult = await query(`
      SELECT 
        id, 
        name, 
        order_num, 
        color
      FROM pipeline_stages 
      ORDER BY order_num
    `);
    const pipelineStages = stagesResult.rows;
    
    // Get sales users (only the fields we need)
    const usersResult = await query(`
      SELECT 
        id, 
        name, 
        email, 
        territory, 
        is_admin
      FROM sales_users 
      ORDER BY name
    `);
    const salesUsers = usersResult.rows;
    
    // Build query based on territory
    let leadsQuery = `
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
        CASE 
          WHEN sl.last_contact_date IS NOT NULL 
          THEN TO_CHAR(sl.last_contact_date, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') 
          ELSE NULL 
        END as last_contact_date,
        CASE 
          WHEN sl.next_follow_up IS NOT NULL 
          THEN TO_CHAR(sl.next_follow_up, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') 
          ELSE NULL 
        END as next_follow_up
      FROM sales_leads sl
      JOIN companies c ON sl.company_id = c.id
      LEFT JOIN pipeline_stages ps ON sl.stage_id = ps.id
      LEFT JOIN sales_users su ON sl.assigned_to = su.id
    `;
    
    // Add territory filter for Jared
    if (isJared) {
      leadsQuery += ` WHERE c.state = 'Arkansas'`;
    }
    
    // Add sorting
    leadsQuery += `
      ORDER BY 
        CASE WHEN sl.next_follow_up < NOW() THEN 0 ELSE 1 END,
        sl.next_follow_up ASC NULLS LAST,
        c.name ASC
      LIMIT 100
    `;
    
    const leadsResult = await query(leadsQuery);
    const leads = leadsResult.rows;
    
    // Get pipeline stats (filtered by territory for Jared)
    let statsQuery = `
      SELECT 
        ps.id as stage_id,
        ps.name as stage_name,
        ps.color as stage_color,
        COUNT(sl.id) as count
      FROM pipeline_stages ps
      LEFT JOIN sales_leads sl ON ps.id = sl.stage_id
    `;
    
    if (isJared) {
      statsQuery += `
        LEFT JOIN companies c ON sl.company_id = c.id
        WHERE c.state = 'Arkansas' OR c.state IS NULL
      `;
    }
    
    statsQuery += `
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
        currentUser: {
          id: 1,
          name: 'Admin User',
          email: 'admin@example.com',
          territory: 'All States',
          is_admin: true
        },
        error: 'Failed to load dashboard data'
      }
    };
  }
};