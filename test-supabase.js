const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
  console.log('🔍 Checking Supabase tables...')
  
  // Test companies table
  try {
    const { data, error } = await supabase.from('companies').select('*').limit(1)
    if (error) {
      console.log('❌ companies table:', error.message)
    } else {
      console.log('✅ companies table exists')
    }
  } catch (e) {
    console.log('❌ companies table error:', e.message)
  }
  
  // Test company_frames table
  try {
    const { data, error } = await supabase.from('company_frames').select('*').limit(1)
    if (error) {
      console.log('❌ company_frames table:', error.message)
    } else {
      console.log('✅ company_frames table exists')
    }
  } catch (e) {
    console.log('❌ company_frames table error:', e.message)
  }
  
  // Test frames table
  try {
    const { data, error } = await supabase.from('frames').select('*').limit(1)
    if (error) {
      console.log('❌ frames table:', error.message)
    } else {
      console.log('✅ frames table exists')
    }
  } catch (e) {
    console.log('❌ frames table error:', e.message)
  }
}

checkTables()