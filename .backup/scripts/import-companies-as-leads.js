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
 * Import companies as leads in our sales pipeline
 */
async function importCompaniesAsLeads() {
  try {
    console.log('Starting import of companies as sales leads...');
    
    // Get the first pipeline stage ID (New Lead)
    const stageResult = await query(
      'SELECT id FROM pipeline_stages WHERE order_num = 1 LIMIT 1'
    );
    
    if (stageResult.rows.length === 0) {
      throw new Error('Pipeline stages not found. Please initialize pipeline stages first.');
    }
    
    const newLeadStageId = stageResult.rows[0].id;
    
    // Count total companies
    const countResult = await query('SELECT COUNT(*) FROM companies');
    const totalCompanies = parseInt(countResult.rows[0].count);
    
    console.log(`Found ${totalCompanies} companies to import as leads`);
    
    // Check how many are already imported
    const existingLeadsResult = await query('SELECT COUNT(*) FROM sales_leads');
    const existingLeads = parseInt(existingLeadsResult.rows[0].count);
    
    console.log(`There are already ${existingLeads} leads in the system`);
    
    if (existingLeads >= totalCompanies) {
      console.log('All companies are already imported as leads. No action needed.');
      return;
    }
    
    // Get all companies that are not yet leads
    const companiesToImportQuery = `
      SELECT c.id, c.name, c.state
      FROM companies c
      LEFT JOIN sales_leads sl ON c.id = sl.company_id
      WHERE sl.id IS NULL
    `;
    
    const companiesToImportResult = await query(companiesToImportQuery);
    const companiesToImport = companiesToImportResult.rows;
    
    console.log(`Found ${companiesToImport.length} companies to import as new leads`);
    
    // Get sales users for territory assignment
    const usersResult = await query('SELECT id, name, territory FROM sales_users');
    const salesUsers = usersResult.rows;
    
    // Find Jared's ID (Arkansas territory)
    let jaredId = null;
    let adminId = null;
    
    for (const user of salesUsers) {
      if (user.territory === 'Arkansas') {
        jaredId = user.id;
      }
      if (user.is_admin) {
        adminId = user.id;
      }
    }
    
    console.log(`Found ${salesUsers.length} sales users`);
    if (jaredId) {
      console.log(`Found Jared's ID: ${jaredId} for Arkansas territory`);
    }
    
    // Process in batches
    const batchSize = 100;
    let processedCount = 0;
    
    for (let i = 0; i < companiesToImport.length; i += batchSize) {
      const batch = companiesToImport.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(companiesToImport.length / batchSize)}`);
      
      for (const company of batch) {
        // Assign based on territory
        let assignedTo = null;
        
        if (company.state === 'Arkansas' && jaredId) {
          assignedTo = jaredId;
        } else if (adminId) {
          assignedTo = adminId;
        }
        
        // Insert the lead
        await query(`
          INSERT INTO sales_leads (
            company_id, 
            assigned_to, 
            stage_id, 
            template_shared,
            template_viewed,
            notes
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          company.id,
          assignedTo,
          newLeadStageId,
          false,
          false,
          `Imported from ${company.state} company database`
        ]);
        
        processedCount++;
      }
      
      console.log(`Processed ${processedCount} leads so far`);
    }
    
    console.log(`Successfully imported ${processedCount} companies as sales leads`);
    
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