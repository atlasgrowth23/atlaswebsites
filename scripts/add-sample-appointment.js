const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Execute a query with error handling
 */
async function query(text, params = []) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Add sample appointments for testing
 */
async function addSampleAppointments() {
  try {
    console.log('Checking if we need to add sample appointments...');
    
    // Check if we have sample data - add one sample appointment if no data exists
    const count = await query('SELECT COUNT(*) FROM sales_appointments');
    
    if (parseInt(count.rows[0].count) === 0) {
      console.log('Adding sample appointments for testing...');
      
      // Get a valid lead_id
      const leadsResult = await query('SELECT id FROM sales_leads LIMIT 3');
      if (leadsResult.rows.length > 0) {
        // Get a valid admin user
        const userResult = await query('SELECT id FROM sales_users LIMIT 1');
        if (userResult.rows.length > 0) {
          const userId = userResult.rows[0].id;
          
          // Create sample appointments
          const today = new Date();
          
          // Tomorrow at 10am
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          
          // Next week
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          nextWeek.setHours(14, 30, 0, 0);
          
          // Add appointments for different leads
          for (let i = 0; i < Math.min(3, leadsResult.rows.length); i++) {
            const leadId = leadsResult.rows[i].id;
            const appointmentDate = new Date(tomorrow);
            appointmentDate.setDate(appointmentDate.getDate() + i);
            
            await query(`
              INSERT INTO sales_appointments (
                lead_id, 
                created_by,
                appointment_date, 
                title, 
                notes,
                appointment_type,
                status
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              leadId, 
              userId,
              appointmentDate.toISOString(), 
              'Initial Consultation #' + (i+1), 
              'Discuss preliminary needs and potential solutions.', 
              'Sales Meeting',
              'scheduled'
            ]);
          }
          
          console.log('Sample appointments created!');
        } else {
          console.log('No sales users found. Please create sales users first.');
        }
      } else {
        console.log('No sales leads found. Please create leads first.');
      }
    } else {
      console.log(`Found ${count.rows[0].count} existing appointments. No need to add samples.`);
    }
  } catch (error) {
    console.error('Error adding sample appointments:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await addSampleAppointments();
    console.log('All done!');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await pool.end();
  }
}

main();