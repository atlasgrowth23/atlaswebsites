import { NextApiRequest, NextApiResponse } from 'next';
import { query, queryOne } from '@/lib/db';

interface CompanyStats {
  totalContacts: number;
  todayJobs: number;
  completedTodayJobs: number;
  upcomingTodayJobs: number;
  openTickets: number;
  urgentTickets: number;
  standardTickets: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { companyId } = req.query;
    
    if (!companyId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company ID is required' 
      });
    }
    
    // Get total number of contacts
    const contactsResult = await queryOne(
      'SELECT COUNT(*) as total FROM company_contacts WHERE company_id = $1',
      [companyId]
    );
    
    // Get today's jobs
    const today = new Date().toISOString().split('T')[0];
    const todayJobsResult = await queryOne(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status != 'completed' AND status != 'cancelled' THEN 1 ELSE 0 END) as upcoming
      FROM company_jobs 
      WHERE company_id = $1 AND scheduled_date::date = $2::date`,
      [companyId, today]
    );
    
    // Get open tickets
    const ticketsResult = await queryOne(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'urgent' OR status = 'emergency' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN status != 'urgent' AND status != 'emergency' AND status != 'completed' AND status != 'cancelled' THEN 1 ELSE 0 END) as standard
      FROM company_jobs 
      WHERE company_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [companyId]
    );
    
    // Get recent activity (last 3 jobs/updates)
    const recentActivity = await query(
      `SELECT 
        id, title, description, status, contact_id, 
        scheduled_date, created_at, updated_at
      FROM company_jobs 
      WHERE company_id = $1
      ORDER BY 
        CASE 
          WHEN status = 'emergency' THEN 0
          WHEN status = 'in_progress' THEN 1
          WHEN status = 'completed' THEN 2
          ELSE 3
        END, 
        updated_at DESC
      LIMIT 3`,
      [companyId]
    );
    
    // Get contact names for the recent activity
    const contactIds = recentActivity.rows
      .filter(job => job.contact_id)
      .map(job => job.contact_id);
      
    let contactNames: Record<string, string> = {};
    
    if (contactIds.length > 0) {
      const contacts = await query(
        `SELECT id, name FROM company_contacts WHERE id = ANY($1)`,
        [contactIds]
      );
      
      contactNames = contacts.rows.reduce<Record<string, string>>((acc, contact) => {
        acc[contact.id] = contact.name;
        return acc;
      }, {});
    }
    
    // Build the stats object
    const stats: CompanyStats = {
      totalContacts: parseInt(contactsResult?.total || '0'),
      todayJobs: parseInt(todayJobsResult?.total || '0'),
      completedTodayJobs: parseInt(todayJobsResult?.completed || '0'),
      upcomingTodayJobs: parseInt(todayJobsResult?.upcoming || '0'),
      openTickets: parseInt(ticketsResult?.total || '0'),
      urgentTickets: parseInt(ticketsResult?.urgent || '0'),
      standardTickets: parseInt(ticketsResult?.standard || '0')
    };
    
    // Combine the activity with contact names
    const activity = recentActivity.rows.map(job => ({
      ...job,
      contact_name: job.contact_id && contactNames[job.contact_id] 
        ? contactNames[job.contact_id] 
        : job.contact_id ? 'Unknown Contact' : null
    }));
    
    return res.status(200).json({
      success: true,
      data: {
        stats,
        activity
      }
    });
  } catch (error) {
    console.error('Error fetching company stats:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}