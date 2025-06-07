const { Pool } = require('pg');
const fetch = require('node-fetch');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function addSiteStatusColumns() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS site_status VARCHAR(20) DEFAULT 'unknown',
      ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS status_code INTEGER,
      ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
    `);
    console.log('✓ Added site_status columns');
  } catch (error) {
    console.error('Error adding columns:', error.message);
  } finally {
    client.release();
  }
}

async function checkWebsiteStatus(url, timeout = 8000) {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'HEAD',
      timeout,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebsiteChecker/1.0)' }
    });
    
    const responseTime = Date.now() - startTime;
    let status = 'unknown';
    
    if (response.status >= 200 && response.status < 300) {
      status = 'active';
    } else if (response.status === 404) {
      status = '404_not_found';
    } else if (response.status >= 400 && response.status < 500) {
      status = 'client_error';
    } else if (response.status >= 500) {
      status = 'server_error';
    }
    
    return { status, statusCode: response.status, responseTime };
    
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      return { status: 'domain_error', statusCode: null, responseTime: null };
    } else if (error.code === 'ETIMEDOUT') {
      return { status: 'timeout', statusCode: null, responseTime: null };
    } else {
      return { status: 'error', statusCode: null, responseTime: null };
    }
  }
}

async function runWebsiteStatusCheck() {
  const client = await pool.connect();
  
  try {
    console.log('Getting companies with websites...');
    
    const result = await client.query(`
      SELECT id, name, site, city, state 
      FROM companies 
      WHERE site IS NOT NULL 
        AND site != '' 
        AND site != 'N/A'
        AND TRIM(site) != ''
        AND (site_status IS NULL OR site_status = 'unknown' OR last_checked < NOW() - INTERVAL '7 days')
      ORDER BY name
    `);
    
    console.log(`Found ${result.rows.length} companies with websites to check`);
    
    const results = { active: 0, broken: 0, total: result.rows.length };
    const brokenSites = [];
    
    for (let i = 0; i < result.rows.length; i++) {
      const company = result.rows[i];
      console.log(`[${i + 1}/${result.rows.length}] ${company.name} - ${company.site}`);
      
      const statusResult = await checkWebsiteStatus(company.site);
      
      await client.query(`
        UPDATE companies 
        SET site_status = $1, status_code = $2, response_time_ms = $3, last_checked = NOW()
        WHERE id = $4
      `, [statusResult.status, statusResult.statusCode, statusResult.responseTime, company.id]);
      
      if (statusResult.status === 'active') {
        results.active++;
        console.log(`   ✓ Active (${statusResult.statusCode})`);
      } else {
        results.broken++;
        brokenSites.push({...company, ...statusResult});
        console.log(`   ✗ ${statusResult.status} (${statusResult.statusCode || 'N/A'})`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log(`\nSUMMARY:`);
    console.log(`Active sites: ${results.active}/${results.total}`);
    console.log(`Broken sites: ${results.broken}/${results.total}`);
    
    if (brokenSites.length > 0) {
      console.log(`\nBROKEN WEBSITES:`);
      brokenSites.forEach(site => {
        console.log(`  • ${site.name} (${site.city}, ${site.state}) - ${site.status}`);
      });
      
      console.log(`\nAdding ${brokenSites.length} companies to broken websites pipeline...`);
      
      for (const company of brokenSites) {
        const existing = await client.query(`
          SELECT id FROM pipeline_leads 
          WHERE company_id = $1 AND pipeline_type = 'broken_websites'
        `, [company.id]);
        
        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO pipeline_leads (company_id, pipeline_type, stage, notes, created_at, updated_at)
            VALUES ($1, 'broken_websites', 'identified', $2, NOW(), NOW())
          `, [company.id, `Website status: ${company.status} (${company.statusCode || 'N/A'}). Site: ${company.site}`]);
        }
      }
      
      console.log(`✓ Added ${brokenSites.length} companies to broken websites pipeline`);
    }
    
    return { total: results.total, active: results.active, broken: results.broken };
    
  } catch (error) {
    console.error('Error checking websites:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addSiteStatusColumns();
    const results = await runWebsiteStatusCheck();
    
    console.log(`\nWebsite status check completed!`);
    console.log(`Total: ${results.total}, Active: ${results.active}, Broken: ${results.broken}`);
    
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();