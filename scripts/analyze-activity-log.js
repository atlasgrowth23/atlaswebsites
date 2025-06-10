const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeActivityLog() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 ACTIVITY LOG ANALYSIS');
    console.log('='.repeat(50));
    
    // Check if ActivityLog table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'activity_log'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ ActivityLog table does not exist');
      return;
    }
    
    // Get table structure
    console.log('\n📋 ACTIVITY LOG STRUCTURE:');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'activity_log'
      ORDER BY ordinal_position
    `);
    
    structure.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'required'})`);
    });
    
    // Get sample data
    console.log('\n📊 SAMPLE ACTIVITY LOG DATA:');
    const samples = await client.query(`
      SELECT * FROM activity_log 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    samples.rows.forEach((row, index) => {
      console.log(`\n--- Sample ${index + 1} ---`);
      Object.keys(row).forEach(key => {
        let value = row[key];
        if (key === 'action_data' && value) {
          console.log(`   ${key}: ${JSON.stringify(value, null, 2)}`);
        } else {
          console.log(`   ${key}: ${value}`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeActivityLog();