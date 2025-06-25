const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function addBrokenWebsitesPipeline() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding broken_websites pipeline type...');
    
    // First check if companies with broken sites exist
    const brokenSitesCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM companies 
      WHERE site_status IN ('404_not_found', 'client_error', 'server_error', 'domain_error', 'timeout', 'error')
        AND site IS NOT NULL 
        AND site != ''
    `);
    
    console.log(`Found ${brokenSitesCheck.rows[0].count} companies with broken websites`);
    
    if (brokenSitesCheck.rows[0].count > 0) {
      // Create pipeline entries for companies with broken websites
      const brokenSites = await client.query(`
        SELECT id, name, site, city, state, site_status, status_code
        FROM companies 
        WHERE site_status IN ('404_not_found', 'client_error', 'server_error', 'domain_error', 'timeout', 'error')
          AND site IS NOT NULL 
          AND site != ''
        ORDER BY CASE 
          WHEN site_status = '404_not_found' THEN 1
          WHEN site_status IN ('server_error', 'client_error') THEN 2
          ELSE 3
        END, name
      `);
      
      let addedCount = 0;
      
      for (const company of brokenSites.rows) {
        // Check if already in any pipeline
        const existing = await client.query(`
          SELECT id FROM pipeline_leads 
          WHERE company_id = $1 AND pipeline_type = 'broken_websites'
        `, [company.id]);
        
        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO pipeline_leads (company_id, pipeline_type, stage, notes, created_at, updated_at)
            VALUES ($1, 'broken_websites', 'identified', $2, NOW(), NOW())
          `, [
            company.id, 
            `Website issue: ${company.site_status} (HTTP ${company.status_code || 'N/A'}). Current site: ${company.site}`
          ]);
          
          addedCount++;
          console.log(`   ✓ Added ${company.name} (${company.city}, ${company.state}) - ${company.site_status}`);
        }
      }
      
      console.log(`\n📊 Summary:`);
      console.log(`   • Total companies with broken sites: ${brokenSites.rows.length}`);
      console.log(`   • Added to pipeline: ${addedCount}`);
      console.log(`   • Already in pipeline: ${brokenSites.rows.length - addedCount}`);
      
    } else {
      console.log('No companies with broken websites found yet. Run website status check first.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addBrokenWebsitesPipeline().catch(console.error);