const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmptyTables() {
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
    const nonExistentTables = [];
    
    for (const tableName of tablesToCheck) {
      try {
        // Try to count rows in table
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            console.log(`❌ ${tableName}: Table does not exist`);
            nonExistentTables.push(tableName);
          } else {
            console.log(`❌ ${tableName}: Error - ${error.message}`);
          }
          continue;
        }
        
        const rowCount = count || 0;
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
    
    if (nonExistentTables.length > 0) {
      console.log('\n🚫 TABLES THAT DON\'T EXIST:');
      nonExistentTables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
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
      console.log('  The following empty tables can be safely deleted:');
      emptyTables.forEach(table => console.log(`    - DROP TABLE ${table};`));
    } else if (nonExistentTables.length === tablesToCheck.length) {
      console.log('  No redundant tables exist - database is already clean');
    } else {
      console.log('  No empty tables found - all existing tables contain data');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEmptyTables();