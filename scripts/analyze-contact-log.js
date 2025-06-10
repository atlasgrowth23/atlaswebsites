const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeContactLog() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CONTACT LOG ANALYSIS');
    console.log('='.repeat(50));
    
    // Get table structure
    console.log('\n📋 CONTACT LOG STRUCTURE:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'contact_log'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    // Get sample data
    console.log('\n📊 SAMPLE CONTACT LOG DATA:');
    const samples = await client.query(`
      SELECT * FROM contact_log 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    samples.rows.forEach((row, index) => {
      console.log(`\n--- Sample ${index + 1} ---`);
      Object.keys(row).forEach(key => {
        let value = row[key];
        console.log(`   ${key}: ${value}`);
      });
    });
    
    // Check who is creating these logs
    console.log('\n👥 WHO CREATES CONTACT LOGS:');
    const creators = await client.query(`
      SELECT created_by, COUNT(*) as count
      FROM contact_log 
      GROUP BY created_by
      ORDER BY count DESC
    `);
    
    creators.rows.forEach(row => {
      console.log(`   ${row.created_by}: ${row.count} entries`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeContactLog();