#!/usr/bin/env tsx

import { supabase, supabaseAdmin } from '../lib/supabase'

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface TableExists {
  tablename: string
}

async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('tablename')
      .eq('table_schema', 'public')
      .eq('tablename', tableName)
    
    if (error) {
      // If information_schema doesn't work, try a direct query
      const { error: queryError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      return !queryError
    }
    
    return data && data.length > 0
  } catch (err) {
    // Try direct query as fallback
    try {
      const { error: queryError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      return !queryError
    } catch {
      return false
    }
  }
}

async function getTableSchema(tableName: string): Promise<TableInfo[]> {
  try {
    // Try to get schema info from information_schema
    const { data, error } = await supabase.rpc('get_table_schema', { 
      table_name: tableName 
    })
    
    if (error || !data) {
      // Fallback: Try to infer schema from a sample query
      console.log(`  ⚠️  Could not get schema from information_schema for ${tableName}`)
      return []
    }
    
    return data
  } catch (err) {
    console.log(`  ⚠️  Could not get schema info for ${tableName}:`, err)
    return []
  }
}

async function getTableRowCount(tableName: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.log(`  ⚠️  Could not get row count for ${tableName}:`, error.message)
      return -1
    }
    
    return count || 0
  } catch (err) {
    console.log(`  ⚠️  Could not get row count for ${tableName}:`, err)
    return -1
  }
}

async function sampleTableData(tableName: string, limit: number = 3) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(limit)
    
    if (error) {
      console.log(`  ⚠️  Could not get sample data from ${tableName}:`, error.message)
      return []
    }
    
    return data || []
  } catch (err) {
    console.log(`  ⚠️  Could not get sample data from ${tableName}:`, err)
    return []
  }
}

async function checkSupabaseConnection(): Promise<boolean> {
  try {
    console.log('🔗 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1)
    
    if (error) {
      console.log('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    return true
  } catch (err) {
    console.log('❌ Connection failed:', err)
    return false
  }
}

async function main() {
  console.log('🔍 Supabase Table Verification Script')
  console.log('=====================================\n')
  
  // Check connection first
  const connected = await checkSupabaseConnection()
  if (!connected) {
    console.log('\n❌ Cannot proceed without database connection')
    console.log('Please check your Supabase environment variables:')
    console.log('- NEXT_PUBLIC_SUPABASE_URL')
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return
  }
  
  const expectedTables = [
    {
      name: 'companies',
      description: 'Main business data (HVAC companies)',
      expectedColumns: [
        'id', 'name', 'slug', 'phone', 'email', 'website', 
        'address', 'city', 'state', 'postal_code', 'rating', 
        'review_count', 'logo', 'custom_domain', 'hours', 
        'saturday_hours', 'sunday_hours', 'emergency_service',
        'created_at', 'updated_at'
      ]
    },
    {
      name: 'company_frames', 
      description: 'Custom images per company',
      expectedColumns: [
        'id', 'company_id', 'slug', 'url', 'created_at', 'updated_at'
      ]
    },
    {
      name: 'frames',
      description: 'Default template images',
      expectedColumns: [
        'id', 'slug', 'template_key', 'default_url', 'description', 
        'created_at', 'updated_at'
      ]
    }
  ]
  
  console.log('📋 Checking expected tables...\n')
  
  const results = {
    existing: [] as string[],
    missing: [] as string[],
    withData: [] as string[],
    empty: [] as string[]
  }
  
  for (const table of expectedTables) {
    console.log(`📊 Table: ${table.name}`)
    console.log(`   Description: ${table.description}`)
    
    const exists = await checkTableExists(table.name)
    
    if (exists) {
      console.log('   ✅ Table exists')
      results.existing.push(table.name)
      
      // Get row count
      const rowCount = await getTableRowCount(table.name)
      if (rowCount > 0) {
        console.log(`   📈 Row count: ${rowCount}`)
        results.withData.push(table.name)
        
        // Show sample data
        console.log('   📄 Sample data:')
        const sampleData = await sampleTableData(table.name, 2)
        if (sampleData.length > 0) {
          sampleData.forEach((row, index) => {
            console.log(`      ${index + 1}. ${JSON.stringify(row, null, 2).substring(0, 100)}...`)
          })
        }
      } else if (rowCount === 0) {
        console.log('   📭 Table is empty')
        results.empty.push(table.name)
      }
      
      // Try to get schema info
      const schema = await getTableSchema(table.name)
      if (schema.length > 0) {
        console.log('   🏗️  Schema:')
        schema.forEach(col => {
          console.log(`      ${col.column_name}: ${col.data_type}${col.is_nullable === 'NO' ? ' NOT NULL' : ''}`)
        })
      }
      
    } else {
      console.log('   ❌ Table does not exist')
      results.missing.push(table.name)
    }
    
    console.log('')
  }
  
  // Summary
  console.log('📊 SUMMARY')
  console.log('==========')
  console.log(`✅ Existing tables: ${results.existing.length}/${expectedTables.length}`)
  if (results.existing.length > 0) {
    console.log(`   - ${results.existing.join(', ')}`)
  }
  
  if (results.missing.length > 0) {
    console.log(`❌ Missing tables: ${results.missing.length}`)
    console.log(`   - ${results.missing.join(', ')}`)
  }
  
  if (results.withData.length > 0) {
    console.log(`📈 Tables with data: ${results.withData.length}`)
    console.log(`   - ${results.withData.join(', ')}`)
  }
  
  if (results.empty.length > 0) {
    console.log(`📭 Empty tables: ${results.empty.length}`)
    console.log(`   - ${results.empty.join(', ')}`)
  }
  
  // Recommendations
  console.log('\n🔧 RECOMMENDATIONS')
  console.log('==================')
  
  if (results.missing.length > 0) {
    console.log('❗ Missing tables detected. To create them:')
    console.log('   1. Run the SQL from scripts/create-supabase-tables.sql in your Supabase dashboard')
    console.log('   2. Or use: npx tsx scripts/create-supabase-tables.ts (if it exists)')
  }
  
  if (results.existing.length === expectedTables.length && results.withData.length === 0) {
    console.log('💡 All tables exist but are empty. Consider:')
    console.log('   - Running data import scripts')
    console.log('   - Adding some test data')
  }
  
  if (results.existing.length === expectedTables.length && results.withData.length > 0) {
    console.log('🎉 Database setup looks good!')
    console.log('   - All expected tables exist')
    console.log('   - Tables contain data')
  }
  
  console.log('\n✨ Verification complete!')
}

if (require.main === module) {
  main().catch(console.error)
}

export { main as verifySupabaseTables }