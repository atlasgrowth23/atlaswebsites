const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findAllLeads() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Finding ALL lead-related tables and data...\n');
    
    // Check what tables exist that might contain leads
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%lead%' OR table_name LIKE '%pipeline%')
      ORDER BY table_name;
    `);
    
    console.log('📋 Lead-related tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Check each table for record counts
    for (const table of tablesResult.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${table.table_name}`);
        console.log(`    ${table.table_name}: ${countResult.rows[0].count} records`);
      } catch (error) {
        console.log(`    ${table.table_name}: Error reading table`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Check if there's a different way companies are filtered in admin
    // Maybe by a flag or different field?
    const companyFieldsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 All fields in companies table:');
    companyFieldsResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });
    
    // Check for any boolean flags that might indicate admin selection
    const flagResult = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN tracking_enabled = true THEN 1 END) as tracking_enabled,
        COUNT(CASE WHEN tracking_paused = true THEN 1 END) as tracking_paused,
        COUNT(CASE WHEN domain_verified = true THEN 1 END) as domain_verified
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas');
    `);
    
    console.log('\n🚩 Company flags in AL/AR:');
    console.log(`  Total companies: ${flagResult.rows[0].total}`);
    console.log(`  tracking_enabled: ${flagResult.rows[0].tracking_enabled}`);
    console.log(`  tracking_paused: ${flagResult.rows[0].tracking_paused}`);
    console.log(`  domain_verified: ${flagResult.rows[0].domain_verified}`);
    
    console.log('\n' + '='.repeat(60));
    
    // Let's see if there are companies with recent activity or updates
    const recentResult = await client.query(`
      SELECT 
        state,
        COUNT(*) as count
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas')
        AND updated_at > '2025-01-01'
      GROUP BY state;
    `);
    
    console.log('\n📅 Recently updated companies (since Jan 1, 2025):');
    recentResult.rows.forEach(row => {
      console.log(`  ${row.state}: ${row.count} companies`);
    });
    
    // Maybe the admin interface filters by something else?
    // Let's check if there are other reference tables
    const allTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('\n📚 All tables in database:');
    allTablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

findAllLeads().catch(console.error);