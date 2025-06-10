const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSpecificTables() {
  try {
    console.log('🔍 Checking specific tables for data...\n');
    
    // Check prospect tracking and daily_analytics specifically
    const tablesToCheck = [
      'prospect_tracking',
      'daily_analytics',
      'prospect_visits',
      'tracking_data'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        console.log(`📊 Checking ${tableName}...`);
        
        // Try to get count and sample data
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          if (countError.message.includes('does not exist') || countError.code === '42P01') {
            console.log(`❌ ${tableName}: Table does not exist\n`);
          } else {
            console.log(`❌ ${tableName}: Error - ${countError.message}\n`);
          }
          continue;
        }
        
        const rowCount = count || 0;
        console.log(`   📈 Row count: ${rowCount}`);
        
        if (rowCount > 0 && rowCount <= 5) {
          // Show sample data for small tables
          const { data: sampleData } = await supabase
            .from(tableName)
            .select('*')
            .limit(3);
            
          console.log(`   📝 Sample data:`, sampleData);
        }
        
        if (rowCount === 0) {
          console.log(`   🗑️  EMPTY - Safe to delete`);
        }
        
        console.log('');
        
      } catch (error) {
        console.log(`❌ ${tableName}: Error - ${error.message}\n`);
      }
    }
    
    // Also specifically check daily_analytics usage
    console.log('🔍 Checking daily_analytics usage in codebase...');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSpecificTables();