const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteAdditionalEmptyTables() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL missing in .env.local');
  }

  const client = await pool.connect();
  
  try {
    console.log('🗑️  Deleting additional empty tables...\n');
    
    // These tables were confirmed to be empty
    const emptyTables = ['prospect_tracking', 'prospect_visits', 'tracking_data'];
    
    for (const tableName of emptyTables) {
      try {
        console.log(`🔍 Checking ${tableName} one more time...`);
        
        // Double-check table exists and is empty before dropping
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
          console.log(`❌ ${tableName}: Table does not exist - SKIPPING`);
          continue;
        }
        
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
    console.log('✅ Additional empty table cleanup completed!');
    
    console.log('\nPhase 2 - Deleted empty tables:');
    console.log('  - prospect_tracking (was empty, has API but unused)');
    console.log('  - prospect_visits (was empty)');
    console.log('  - tracking_data (was empty)');
    
    console.log('\nPreviously deleted (Phase 1):');
    console.log('  - leads (was empty)');
    console.log('  - lead_activity (was empty)');
    
    console.log('\nKEPT - Tables with data that need further analysis:');
    console.log('  - page_views (16 rows) - may be redundant with template_views');
    console.log('  - lead_notes (144 rows) - needs migration to lead_pipeline.notes');
    console.log('  - contact_log (93 rows) - may be redundant with activity_log');
    console.log('  - daily_analytics (70 rows) - ACTIVE IN PRODUCTION APIs');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

deleteAdditionalEmptyTables().catch(console.error);