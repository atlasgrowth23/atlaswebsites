const { Pool } = require('pg');
const fetch = require('node-fetch');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function quickWebsiteCheck() {
  const client = await pool.connect();
  
  try {
    // Get a smaller batch for faster testing
    const result = await client.query(`
      SELECT id, name, site, city, state 
      FROM companies 
      WHERE site IS NOT NULL 
        AND site != '' 
        AND site != 'N/A'
        AND site_status IS NULL
      ORDER BY name
      LIMIT 25
    `);
    
    console.log(`Checking ${result.rows.length} websites...`);
    
    const brokenSites = [];
    
    for (const company of result.rows) {
      try {
        let url = company.site;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }
        
        const response = await fetch(url, {
          method: 'HEAD',
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; StatusChecker/1.0)' }
        });
        
        let status = 'active';
        if (response.status === 404) {
          status = '404_not_found';
          brokenSites.push(company);
        } else if (response.status >= 400) {
          status = 'error';
          brokenSites.push(company);
        }
        
        await client.query(`
          UPDATE companies 
          SET site_status = $1, status_code = $2, last_checked = NOW()
          WHERE id = $3
        `, [status, response.status, company.id]);
        
        console.log(`${company.name}: ${status} (${response.status})`);
        
      } catch (error) {
        const status = error.code === 'ENOTFOUND' ? 'domain_error' : 'timeout';
        brokenSites.push(company);
        
        await client.query(`
          UPDATE companies 
          SET site_status = $1, last_checked = NOW()
          WHERE id = $2
        `, [status, company.id]);
        
        console.log(`${company.name}: ${status}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log(`\nFound ${brokenSites.length} broken websites`);
    
    // Add broken sites to pipeline
    for (const company of brokenSites) {
      const existing = await client.query(`
        SELECT id FROM pipeline_leads 
        WHERE company_id = $1 AND pipeline_type = 'broken_websites'
      `, [company.id]);
      
      if (existing.rows.length === 0) {
        await client.query(`
          INSERT INTO pipeline_leads (company_id, pipeline_type, stage, notes, created_at, updated_at)
          VALUES ($1, 'broken_websites', 'identified', $2, NOW(), NOW())
        `, [company.id, `Website issue detected. Site: ${company.site}`]);
        
        console.log(`Added ${company.name} to broken websites pipeline`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

quickWebsiteCheck();