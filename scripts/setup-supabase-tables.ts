import { supabaseAdmin } from '../lib/supabase'

async function setupTables() {
  console.log('Setting up Supabase tables...')

  try {
    // Create companies table
    const { error: companiesError } = await supabaseAdmin.rpc('create_companies_table', {})
    
    if (companiesError && !companiesError.message.includes('already exists')) {
      console.error('Error creating companies table:', companiesError)
    } else {
      console.log('✅ Companies table ready')
    }

    // Create company_frames table
    const { error: framesError } = await supabaseAdmin.rpc('create_company_frames_table', {})
    
    if (framesError && !framesError.message.includes('already exists')) {
      console.error('Error creating company_frames table:', framesError)
    } else {
      console.log('✅ Company frames table ready')
    }

    // Create frames table (template defaults)
    const { error: templateFramesError } = await supabaseAdmin.rpc('create_frames_table', {})
    
    if (templateFramesError && !templateFramesError.message.includes('already exists')) {
      console.error('Error creating frames table:', templateFramesError)
    } else {
      console.log('✅ Template frames table ready')
    }

    console.log('\n🎉 Supabase tables setup complete!')
    
  } catch (error) {
    console.error('Setup failed:', error)
  }
}

// Run if called directly
if (require.main === module) {
  setupTables()
}

export { setupTables }