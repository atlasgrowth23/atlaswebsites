#!/usr/bin/env tsx

import { supabase } from '../lib/supabase'

async function checkTable(tableName: string) {
  console.log(`\n📋 Checking table: ${tableName}`)
  console.log(''.padEnd(40, '-'))
  
  try {
    // Try to query the table
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(3)
    
    if (error) {
      console.log(`❌ Table does not exist or cannot be accessed`)
      console.log(`   Error: ${error.message}`)
      return false
    }
    
    console.log(`✅ Table exists`)
    console.log(`📊 Row count: ${count || 0}`)
    
    if (data && data.length > 0) {
      console.log(`📄 Sample data (first ${data.length} rows):`)
      data.forEach((row, index) => {
        const keys = Object.keys(row).slice(0, 4) // Show first 4 columns
        const preview = keys.map(key => `${key}: ${row[key]}`).join(', ')
        console.log(`   ${index + 1}. ${preview}${Object.keys(row).length > 4 ? '...' : ''}`)
      })
      
      console.log(`🔍 Available columns: ${Object.keys(data[0]).join(', ')}`)
    } else {
      console.log(`📭 Table is empty`)
    }
    
    return true
    
  } catch (err) {
    console.log(`❌ Error checking table: ${err}`)
    return false
  }
}

async function testConnection() {
  console.log('🔗 Testing Supabase connection...')
  
  try {
    // Simple connection test - try to create a temporary query
    const { error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .limit(1)
    
    if (error) {
      // Try alternative connection test
      const { error: altError } = await supabase.rpc('now')
      if (altError) {
        console.log('❌ Connection failed')
        console.log('   Make sure these environment variables are set:')
        console.log('   - NEXT_PUBLIC_SUPABASE_URL')
        console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
        return false
      }
    }
    
    console.log('✅ Connection successful')
    return true
    
  } catch (err) {
    console.log('❌ Connection failed:', err)
    return false
  }
}

async function main() {
  console.log('🔍 Simple Supabase Table Check')
  console.log('==============================')
  
  // Test connection first
  const connected = await testConnection()
  if (!connected) {
    return
  }
  
  const tables = ['companies', 'company_frames', 'frames']
  const results = {
    existing: 0,
    missing: 0,
    withData: 0,
    empty: 0
  }
  
  for (const table of tables) {
    const exists = await checkTable(table)
    if (exists) {
      results.existing++
      
      // Quick check if table has data
      try {
        const { count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (count && count > 0) {
          results.withData++
        } else {
          results.empty++
        }
      } catch (err) {
        // Ignore count errors
      }
    } else {
      results.missing++
    }
  }
  
  console.log('\n📊 SUMMARY')
  console.log('==========')
  console.log(`✅ Tables found: ${results.existing}/${tables.length}`)
  console.log(`📈 Tables with data: ${results.withData}`)
  console.log(`📭 Empty tables: ${results.empty}`)
  console.log(`❌ Missing tables: ${results.missing}`)
  
  if (results.missing > 0) {
    console.log('\n🔧 NEXT STEPS')
    console.log('=============')
    console.log('Missing tables detected. To create them:')
    console.log('1. Open your Supabase dashboard')
    console.log('2. Go to the SQL Editor')
    console.log('3. Run the SQL from: scripts/create-supabase-tables.sql')
    console.log('4. Re-run this script to verify')
  }
  
  if (results.existing === tables.length) {
    console.log('\n🎉 All expected tables are present!')
    if (results.withData === 0) {
      console.log('💡 Consider importing some test data to get started.')
    }
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { main as simpleTableCheck }