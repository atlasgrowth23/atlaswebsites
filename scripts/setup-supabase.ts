import { supabaseAdmin } from '../lib/supabase'
import { readFileSync } from 'fs'
import { join } from 'path'

async function setupSupabase() {
  console.log('🚀 Setting up Supabase tables...')
  
  try {
    // Read the SQL file
    const sqlPath = join(__dirname, 'create-supabase-tables.sql')
    const sql = readFileSync(sqlPath, 'utf8')
    
    // Execute the SQL (Supabase supports multi-statement execution)
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql })
    
    if (error) {
      console.error('❌ Error setting up tables:', error)
      return
    }
    
    console.log('✅ Tables created successfully!')
    
    // Test the connection by fetching companies
    const { data: companies, error: testError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.error('❌ Error testing connection:', testError)
      return
    }
    
    console.log(`✅ Connection test successful! Found ${companies?.length || 0} companies`)
    console.log('🎉 Supabase setup complete!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run if called directly
if (require.main === module) {
  setupSupabase()
}

export { setupSupabase }