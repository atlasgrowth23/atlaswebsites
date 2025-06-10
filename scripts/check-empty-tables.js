const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkEmptyTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for empty tables...\n');
    
    // Tables to check for emptiness (potentially redundant ones)
    const tablesToCheck = [
      'page_views',
      'leads', 
      'lead_activity',
      'lead_notes',
      'contact_log',
      'daily_analytics'
    ];
    
    const emptyTables = [];
    const nonEmptyTables = [];
    
    for (const tableName of tablesToCheck) {
      try {
        // Check if table exists first
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
          console.log(`❌ ${tableName}: Table does not exist`);
          continue;
        }
        
        // Count rows in table
        const result = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const rowCount = parseInt(result.rows[0].count);
        
        console.log(`📊 ${tableName}: ${rowCount} rows`);
        
        if (rowCount === 0) {
          emptyTables.push(tableName);
        } else {
          nonEmptyTables.push({
            table: tableName,
            count: rowCount
          });
        }
        
      } catch (error) {
        console.log(`❌ ${tableName}: Error checking - ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n📋 SUMMARY:');
    
    if (emptyTables.length > 0) {
      console.log('\n🗑️  EMPTY TABLES (safe to delete):');
      emptyTables.forEach(table => {
        console.log(`  ✓ ${table}`);
      });
    }
    
    if (nonEmptyTables.length > 0) {
      console.log('\n⚠️  TABLES WITH DATA (need review before deletion):');
      nonEmptyTables.forEach(item => {
        console.log(`  - ${item.table}: ${item.count} rows`);
      });
    }
    
    console.log('\n🎯 RECOMMENDATION:');
    if (emptyTables.length > 0) {
      console.log('  Run the delete-empty-tables.js script to remove empty tables');
    } else {
      console.log('  No empty tables found - all tables contain data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkEmptyTables().catch(console.error);