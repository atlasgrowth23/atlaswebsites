const { Pool } = require('pg');
const fetch = require('node-fetch');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function addSiteStatusColumn() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Adding site_status column to companies table...');
    
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS site_status VARCHAR(20) DEFAULT 'unknown',
      ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS status_code INTEGER,
      ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
    `);
    
    console.log('✓ Added site_status column');
    
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function checkWebsiteStatus(url, timeout = 10000) {
  try {
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'HEAD',
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
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
    } else if (response.status >= 300 && response.status < 400) {
      status = 'redirect';
    }
    
    return {
      status,
      statusCode: response.status,
      responseTime
    };
    
  } catch (error) {
    console.log(`❌ Error checking ${url}: ${error.message}`);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return { status: 'domain_error', statusCode: null, responseTime: null };
    } else if (error.code === 'ETIMEDOUT') {
      return { status: 'timeout', statusCode: null, responseTime: null };
    } else {
      return { status: 'error', statusCode: null, responseTime: null };
    }
  }
}

async function updateCompanyStatus(client, companyId, statusResult) {
  await client.query(`
    UPDATE companies 
    SET site_status = $1, 
        status_code = $2, 
        response_time_ms = $3, 
        last_checked = NOW()
    WHERE id = $4
  `, [statusResult.status, statusResult.statusCode, statusResult.responseTime, companyId]);
}

async function checkAllWebsites() {
  const client = await pool.connect();
  
  try {
    console.log('🌐 Getting companies with websites...');
    
    const result = await client.query(`
      SELECT id, name, site, city, state 
      FROM companies 
      WHERE site IS NOT NULL 
        AND site != '' 
        AND site != 'N/A'
      ORDER BY name
      LIMIT 100
    `);
    
    console.log(`📊 Found ${result.rows.length} companies with websites`);
    
    const results = {
      active: [],
      errors: [],
      notFound: [],
      timeout: [],
      other: []
    };
    
    for (let i = 0; i < result.rows.length; i++) {
      const company = result.rows[i];
      console.log(`\n🔍 [${i + 1}/${result.rows.length}] Checking ${company.name} (${company.site})`);
      
      const statusResult = await checkWebsiteStatus(company.site);
      await updateCompanyStatus(client, company.id, statusResult);
      
      console.log(`   Status: ${statusResult.status} (${statusResult.statusCode || 'N/A'})`);
      
      // Categorize results
      const companyInfo = {
        id: company.id,
        name: company.name,
        site: company.site,
        city: company.city,
        state: company.state,
        status: statusResult.status,
        statusCode: statusResult.statusCode,
        responseTime: statusResult.responseTime
      };
      
      switch (statusResult.status) {
        case 'active':
          results.active.push(companyInfo);
          break;
        case '404_not_found':
          results.notFound.push(companyInfo);
          break;
        case 'timeout':
        case 'domain_error':
          results.timeout.push(companyInfo);
          break;
        case 'client_error':
        case 'server_error':
        case 'error':
          results.errors.push(companyInfo);
          break;
        default:
          results.other.push(companyInfo);
      }
      
      // Add small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Print summary
    console.log('\n📈 WEBSITE STATUS SUMMARY');
    console.log('========================');
    console.log(`✅ Active sites: ${results.active.length}`);
    console.log(`❌ 404/Not Found: ${results.notFound.length}`);
    console.log(`⏰ Timeout/Domain errors: ${results.timeout.length}`);
    console.log(`🔧 Other errors: ${results.errors.length}`);
    console.log(`❓ Other statuses: ${results.other.length}`);
    
    if (results.notFound.length > 0) {
      console.log('\n🚨 COMPANIES WITH BROKEN WEBSITES (404):');
      results.notFound.forEach(company => {
        console.log(`   • ${company.name} (${company.city}, ${company.state}) - ${company.site}`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  COMPANIES WITH ERROR WEBSITES:');
      results.errors.forEach(company => {
        console.log(`   • ${company.name} (${company.city}, ${company.state}) - ${company.site} [${company.status}]`);
      });
    }
    
    if (results.timeout.length > 0) {
      console.log('\n🐌 COMPANIES WITH SLOW/UNREACHABLE WEBSITES:');
      results.timeout.forEach(company => {
        console.log(`   • ${company.name} (${company.city}, ${company.state}) - ${company.site} [${company.status}]`);
      });
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Error checking websites:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function createBrokenWebsitePipeline() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Creating pipeline entries for broken websites...');
    
    // Get companies with broken websites
    const brokenSites = await client.query(`
      SELECT id, name, site, city, state, site_status, status_code
      FROM companies 
      WHERE site_status IN ('404_not_found', 'client_error', 'server_error', 'domain_error', 'timeout', 'error')
        AND site IS NOT NULL 
        AND site != ''
    `);
    
    console.log(`Found ${brokenSites.rows.length} companies with broken websites`);
    
    if (brokenSites.rows.length > 0) {
      // Create pipeline entries for broken websites
      for (const company of brokenSites.rows) {
        // Check if already in pipeline
        const existing = await client.query(`
          SELECT id FROM pipeline_leads 
          WHERE company_id = $1 AND pipeline_type = 'broken_websites'
        `, [company.id]);
        
        if (existing.rows.length === 0) {
          await client.query(`
            INSERT INTO pipeline_leads (company_id, pipeline_type, stage, notes, created_at, updated_at)
            VALUES ($1, 'broken_websites', 'identified', $2, NOW(), NOW())
          `, [company.id, `Website status: ${company.site_status} (${company.status_code || 'N/A'}). Site: ${company.site}`]);
          
          console.log(`   ✓ Added ${company.name} to broken websites pipeline`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating broken website pipeline:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await addSiteStatusColumn();
    const results = await checkAllWebsites();
    await createBrokenWebsitePipeline();
    
    console.log('\n🎉 Website status check completed successfully!');
    
  } catch (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();