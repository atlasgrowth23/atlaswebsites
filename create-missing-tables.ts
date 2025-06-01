import { supabaseAdmin } from './lib/supabase';

async function createMissingTables() {
  console.log('Creating missing database tables...');
  
  try {
    // First, let's test with a simple query
    const { data: testData, error: testError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('Companies count test:', testData);
    
    // Create company_frames table
    const { error: framesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS company_frames (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          company_id TEXT NOT NULL,
          slug TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(company_id, slug)
        );
      `
    });
    
    if (framesError) {
      console.error('❌ Error creating company_frames:', framesError);
    } else {
      console.log('✅ Created company_frames table');
    }
    
    // Create frames (template defaults) table
    const { error: templatesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS frames (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          slug TEXT NOT NULL,
          template_key TEXT NOT NULL,
          default_url TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(template_key, slug)
        );
      `
    });
    
    if (templatesError) {
      console.error('❌ Error creating frames:', templatesError);
    } else {
      console.log('✅ Created frames table');
    }
    
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the setup
createMissingTables();