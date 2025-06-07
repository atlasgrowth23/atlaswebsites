const { Pool } = require('pg');
const fetch = require('node-fetch');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

// Process websites in batches to avoid overwhelming servers
const BATCH_SIZE = 20;
const DELAY_BETWEEN_REQUESTS = 250; // ms
const DELAY_BETWEEN_BATCHES = 2000; // ms

async function setupDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS site_status VARCHAR(20) DEFAULT 'unknown',
      ADD COLUMN IF NOT EXISTS last_checked TIMESTAMP WITH TIME ZONE,
      ADD COLUMN IF NOT EXISTS status_code INTEGER,
      ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
    `);
    console.log('Database setup complete');
  } finally {
    client.release();
  }
}

async function checkWebsite(url, timeout = 10000) {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'HEAD',
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      redirect: 'follow'
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
    
    return { status, statusCode: response.status, responseTime };
    
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      return { status: 'domain_error', statusCode: null, responseTime: null };
    } else if (error.code === 'ETIMEDOUT' || error.name === 'FetchError') {
      return { status: 'timeout', statusCode: null, responseTime: null };
    } else {
      return { status: 'error', statusCode: null, responseTime: null };
    }
  }
}

async function processBatch(companies, batchNumber, totalBatches) {
  const client = await pool.connect();
  const results = { active: 0, broken: 0, errors: 0 };
  
  try {
    console.log(`\nProcessing batch ${batchNumber}/${totalBatches} (${companies.length} companies)`);
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      console.log(`  [${i + 1}/${companies.length}] ${company.name} - ${company.site}`);
      
      const statusResult = await checkWebsite(company.site);
      
      // Update database with results
      await client.query(`
        UPDATE companies 
        SET site_status = $1, status_code = $2, response_time_ms = $3, last_checked = NOW()
        WHERE id = $4
      `, [statusResult.status, statusResult.statusCode, statusResult.responseTime, company.id]);
      
      // Categorize results
      if (statusResult.status === 'active' || statusResult.status === 'redirect') {
        results.active++;
        console.log(`    ✓ ${statusResult.status} (${statusResult.statusCode})`);
      } else if (['404_not_found', 'client_error', 'server_error'].includes(statusResult.status)) {
        results.broken++;
        console.log(`    ✗ ${statusResult.status} (${statusResult.statusCode || 'N/A'})`);
        
        // Add to broken websites pipeline
        await addToBrokenPipeline(client, company, statusResult);
      } else {
        results.errors++;
        console.log(`    ? ${statusResult.status}`);
      }
      
      // Small delay between requests
      if (i < companies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));
      }
    }
    
    return results;
    
  } finally {
    client.release();
  }
}

async function addToBrokenPipeline(client, company, statusResult) {
  try {
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
        `Website issue: ${statusResult.status} (HTTP ${statusResult.statusCode || 'N/A'}). Site: ${company.site}`
      ]);
    }
  } catch (error) {
    console.log(`    Error adding to pipeline: ${error.message}`);
  }
}

async function main() {
  const startTime = Date.now();
  
  try {
    await setupDatabase();
    
    const client = await pool.connect();
    
    // Get all companies with websites that haven't been checked recently
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
    
    client.release();
    
    const totalCompanies = result.rows.length;
    console.log(`Found ${totalCompanies} companies with websites to check`);
    
    if (totalCompanies === 0) {
      console.log('No websites need checking. All are up to date.');
      return;
    }
    
    // Split into batches
    const batches = [];
    for (let i = 0; i < totalCompanies; i += BATCH_SIZE) {
      batches.push(result.rows.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Processing ${totalCompanies} websites in ${batches.length} batches of ${BATCH_SIZE}`);
    
    let totalResults = { active: 0, broken: 0, errors: 0 };
    
    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await processBatch(batches[i], i + 1, batches.length);
      
      totalResults.active += batchResults.active;
      totalResults.broken += batchResults.broken;
      totalResults.errors += batchResults.errors;
      
      // Delay between batches (except for the last one)
      if (i < batches.length - 1) {
        console.log(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
      }
    }
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n=== FINAL SUMMARY ===`);
    console.log(`Total websites checked: ${totalCompanies}`);
    console.log(`Active/Working sites: ${totalResults.active}`);
    console.log(`Broken sites: ${totalResults.broken}`);
    console.log(`Connection errors: ${totalResults.errors}`);
    console.log(`Processing time: ${duration} seconds`);
    console.log(`Average: ${Math.round(totalCompanies / duration * 60)} sites per minute`);
    
    if (totalResults.broken > 0) {
      console.log(`\n${totalResults.broken} companies with broken websites have been added to the 'broken_websites' pipeline.`);
    }
    
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();