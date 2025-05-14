import { query } from './db';

/**
 * Fetch sales data from the server based on the specified tab
 * @param tab The active tab for which to fetch data
 * @param userId The current user's ID for filtering data
 * @returns Object containing data for the specified tab
 */
export async function fetchSalesData(tab = 'dashboard', userId?: number) {
  try {
    // Get sales users for reference
    const usersResult = await query(
      'SELECT id, name, email, territory, is_admin FROM sales_users ORDER BY name'
    );
    const salesUsers = usersResult.rows;
    
    // Determine current user if userId provided
    let currentUser;
    if (userId) {
      currentUser = salesUsers.find(u => u.id === userId);
    }
    
    if (!currentUser) {
      // Default to admin user
      currentUser = salesUsers.find(u => u.is_admin) || salesUsers[0];
    }
    
    // Filter condition for territory if not admin
    const territoryFilter = currentUser.is_admin 
      ? '' 
      : `WHERE c.state = '${currentUser.territory}'`;
    
    // Fetch data based on tab
    switch (tab) {
      case 'dashboard': {
        // Get pipeline stages
        const stagesResult = await query(
          'SELECT id, name, order_num, color FROM pipeline_stages ORDER BY order_num ASC'
        );
        const pipelineStages = stagesResult.rows;
        
        // Get leads
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
        
        // Get upcoming appointments
        let upcomingAppointments = [];
        try {
          // Check if the appointments table exists
          const tableExists = await query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_name = 'sales_appointments'
            );
          `);
          
          if (tableExists.rows[0].exists) {
            const appointmentsResult = await query(`
              SELECT 
                a.id,
                a.lead_id,
                c.name as company_name,
                a.appointment_date,
                a.title
              FROM 
                sales_appointments a
              JOIN 
                leads l ON a.lead_id = l.id
              JOIN 
                companies c ON l.company_id = c.id
              WHERE
                a.appointment_date >= NOW()
              ORDER BY 
                a.appointment_date ASC
              LIMIT 5
            `);
            
            // Ensure dates are properly serialized for Next.js props
            upcomingAppointments = appointmentsResult.rows.map(appointment => ({
              ...appointment,
              appointment_date: new Date(appointment.appointment_date).toISOString()
            }));
          }
        } catch (error) {
          console.error('Error fetching appointments:', error);
        }
        
        return {
          pipelineStages,
          salesUsers,
          leads,
          pipelineStats,
          currentUser,
          totalLeads,
          upcomingAppointments
        };
      }
      
      case 'leads': {
        // Get pipeline stages
        const stagesResult = await query(
          'SELECT id, name, order_num, color FROM pipeline_stages ORDER BY order_num ASC'
        );
        const pipelineStages = stagesResult.rows;
        
        // Get total count for pagination
        const countQuery = `
          SELECT COUNT(*) as total 
          FROM leads l
          JOIN companies c ON l.company_id = c.id
          ${territoryFilter}
        `;
        
        const countResult = await query(countQuery);
        const totalLeads = parseInt(countResult.rows[0].total);
        const totalPages = Math.ceil(totalLeads / 100);
        
        // Get leads with pagination
        const leadsQuery = `
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
        
        return {
          pipelineStages,
          salesUsers,
          leads,
          currentUser,
          totalLeads,
          page: 1,
          totalPages
        };
      }
      
      case 'appointments': {
        // Get appointments
        let appointments = [];
        
        // Check if the table exists
        const tableExists = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'sales_appointments'
          );
        `);
        
        if (tableExists.rows[0].exists) {
          const appointmentsResult = await query(`
            SELECT 
              a.id,
              a.lead_id,
              c.name as company_name,
              a.appointment_date,
              a.title,
              a.notes,
              a.user_id as created_by,
              su.name as created_by_name,
              a.location as appointment_type
            FROM 
              sales_appointments a
            JOIN 
              leads l ON a.lead_id = l.id
            JOIN 
              companies c ON l.company_id = c.id
            JOIN
              sales_users su ON a.user_id = su.id
            WHERE
              a.appointment_date >= NOW()
            ORDER BY 
              a.appointment_date ASC
          `);
          
          // Convert date strings to ISO strings to make them serializable
          appointments = appointmentsResult.rows.map(appointment => ({
            ...appointment,
            appointment_date: new Date(appointment.appointment_date).toISOString()
          }));
        }
        
        return {
          appointments,
          currentUser
        };
      }
      
      default:
        return { currentUser };
    }
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return { error: 'Failed to fetch sales data' };
  }
}