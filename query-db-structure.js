const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function getDbStructure() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Querying database structure...\n');
    
    // 1. Get parsed_working_hours example from companies table
    console.log('1. PARSED_WORKING_HOURS STRUCTURE:');
    const { rows: workingHoursExample } = await client.query(`
      SELECT name, parsed_working_hours 
      FROM companies 
      WHERE parsed_working_hours IS NOT NULL 
      LIMIT 1
    `);
    
    if (workingHoursExample.length > 0) {
      console.log('Example from business:', workingHoursExample[0].name);
      console.log('JSON structure:', JSON.stringify(workingHoursExample[0].parsed_working_hours, null, 2));
    } else {
      console.log('No businesses found with parsed_working_hours data');
    }
    
    console.log('\n2. ALL SUPABASE TABLES (excluding companies):');
    
    // 2. Get all tables except companies
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name != 'companies'
      ORDER BY table_name
    `);
    
    // Get columns for each table
    for (const table of tables) {
      console.log(`\n📋 TABLE: ${table.table_name}`);
      
      const { rows: columns } = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      
      columns.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? ' (nullable)' : ' (required)';
        const defaultVal = col.column_default ? ` default: ${col.column_default}` : '';
        console.log(`  - ${col.column_name}: ${col.data_type}${nullable}${defaultVal}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

getDbStructure();