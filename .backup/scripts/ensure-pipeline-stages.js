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
 * Ensure pipeline stages exist
 */
async function ensurePipelineStages() {
  try {
    console.log('Checking pipeline stages...');
    
    // Check if we have stages
    const count = await query('SELECT COUNT(*) FROM pipeline_stages');
    
    if (parseInt(count.rows[0].count) === 0) {
      console.log('Adding default pipeline stages...');
      
      const stages = [
        { name: 'New Lead', order_num: 10, color: '#6366F1' }, // Indigo
        { name: 'Initial Contact Attempted', order_num: 20, color: '#8B5CF6' }, // Purple
        { name: 'Initial Contact Made', order_num: 30, color: '#EC4899' }, // Pink
        { name: 'Template Shared', order_num: 40, color: '#F97316' }, // Orange
        { name: 'Template Viewed', order_num: 50, color: '#EAB308' }, // Yellow
        { name: 'Appointment Scheduled', order_num: 60, color: '#84CC16' }, // Lime
        { name: 'Appointment Completed', order_num: 70, color: '#14B8A6' }, // Teal
        { name: 'Deal Proposed', order_num: 80, color: '#0EA5E9' }, // Sky
        { name: 'Closed Won', order_num: 90, color: '#22C55E' }, // Green
        { name: 'Closed Lost', order_num: 100, color: '#EF4444' }, // Red
      ];
      
      for (const stage of stages) {
        await query(`
          INSERT INTO pipeline_stages (name, order_num, color)
          VALUES ($1, $2, $3)
        `, [stage.name, stage.order_num, stage.color]);
      }
      
      console.log('Default pipeline stages added!');
    } else {
      console.log(`Found ${count.rows[0].count} existing pipeline stages.`);
    }
  } catch (error) {
    console.error('Error ensuring pipeline stages:', error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    await ensurePipelineStages();
    console.log('All done!');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await pool.end();
  }
}

main();