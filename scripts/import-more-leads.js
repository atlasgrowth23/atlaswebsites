const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

// Database connection
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
  } catch (err) {
    console.error(`Error executing query: ${err.message}`);
    throw err;
  }
}

/**
 * Import the filtered companies into the leads table
 */
async function importCompaniesAsLeads() {
  try {
    const allCompanies = await query('SELECT * FROM companies ORDER BY id');
    const companies = allCompanies.rows;
    
    // Get all sales users
    const usersResult = await query('SELECT * FROM sales_users');
    const salesUsers = usersResult.rows;
    
    // Get the initial stage (usually "New Lead")
    const stageResult = await query('SELECT * FROM pipeline_stages WHERE order_num = 1');
    const initialStage = stageResult.rows[0];
    
    console.log(`Found ${companies.length} companies to import...`);
    console.log(`Using stage: ${initialStage.name} (ID: ${initialStage.id})`);
    
    let importCount = 0;
    
    for (const company of companies) {
      // Check if the lead already exists
      const existingResult = await query(
        'SELECT * FROM leads WHERE company_id = $1', 
        [company.id]
      );
      
      if (existingResult.rows.length > 0) {
        console.log(`Lead for ${company.name} already exists, skipping...`);
        continue;
      }
      
      // Assign based on state territory - default to admin for unknown territories
      let assignedUser = salesUsers.find(u => u.is_admin);
      
      // Match Arkansas to Jared
      if (company.state === 'AR') {
        const jared = salesUsers.find(u => u.territory === 'AR');
        if (jared) assignedUser = jared;
      }
      
      // Insert the lead
      await query(
        `INSERT INTO leads (
          company_id, assigned_to, stage_id, template_shared, template_viewed, 
          template_view_count, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          company.id, 
          assignedUser.id, 
          initialStage.id,
          false, 
          false, 
          0,
          `Imported automatically from filtered companies list.`,
          new Date()
        ]
      );
      
      importCount++;
      
      if (importCount % 50 === 0) {
        console.log(`Imported ${importCount} leads so far...`);
      }
      
      // Import 200 companies for a proper database of leads
      if (importCount >= 200) {
        break;
      }
    }
    
    console.log(`Successfully imported ${importCount} companies as leads.`);
  } catch (error) {
    console.error('Error importing companies as leads:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importCompaniesAsLeads().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});