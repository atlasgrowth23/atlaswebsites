const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Checking existing pipeline tables...');

  try {
    // Check if lead_pipeline exists and what its structure is
    const { data: leadPipeline, error: pipelineError } = await supabase
      .from('lead_pipeline')
      .select('*')
      .limit(1);

    if (pipelineError) {
      console.log('❌ lead_pipeline table error:', pipelineError.message);
    } else {
      console.log('✅ lead_pipeline table exists');
      if (leadPipeline && leadPipeline.length > 0) {
        console.log('Sample record structure:', Object.keys(leadPipeline[0]));
      }
    }

    // Check companies table
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(1);

    if (companiesError) {
      console.log('❌ companies table error:', companiesError.message);
    } else {
      console.log('✅ companies table exists');
    }

    // Try to see what other tables might exist
    const potentialTables = ['leads', 'lead_notes', 'lead_activity', 'contact_log'];
    
    for (const table of potentialTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table} exists`);
          if (data && data.length > 0) {
            console.log(`  Sample structure:`, Object.keys(data[0]));
          }
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

checkTables().then(() => {
  console.log('✅ Table check completed');
  process.exit(0);
});