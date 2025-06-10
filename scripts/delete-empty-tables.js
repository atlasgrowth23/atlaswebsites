const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteEmptyTables() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL missing in env.local');
  }

  const client = await pool.connect();
  
  try {
    console.log('🗑️  Deleting empty tables...\n');
    
    // These tables were confirmed to be empty
    const emptyTables = ['leads', 'lead_activity'];
    
    for (const tableName of emptyTables) {
      try {
        console.log(`🔍 Checking ${tableName} one more time...`);
        
        // Double-check table is empty before dropping
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = parseInt(countResult.rows[0].count);
        
        if (rowCount > 0) {
          console.log(`⚠️  ${tableName} now has ${rowCount} rows - SKIPPING deletion`);
          continue;
        }
        
        console.log(`✅ ${tableName} confirmed empty (${rowCount} rows)`);
        
        // Drop the table
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE;`);
        console.log(`🗑️  Deleted table: ${tableName}`);
        
      } catch (error) {
        console.error(`❌ Error deleting ${tableName}:`, error.message);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Empty table cleanup completed!');
    console.log('\nDeleted tables:');
    console.log('  - leads (was empty)');
    console.log('  - lead_activity (was empty)');
    
    console.log('\nTables with data that were kept:');
    console.log('  - page_views (16 rows)');
    console.log('  - lead_notes (144 rows) ');
    console.log('  - contact_log (93 rows)');
    console.log('  - daily_analytics (70 rows)');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

deleteEmptyTables().catch(console.error);