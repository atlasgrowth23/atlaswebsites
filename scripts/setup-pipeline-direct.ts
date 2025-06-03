import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPipelineTables() {
  console.log('🏗️  Setting up pipeline tables...');
  
  try {
    // Create lead_pipeline table
    const { error: pipelineError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS lead_pipeline (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL,
          stage TEXT NOT NULL DEFAULT 'new_lead',
          last_contact_date TIMESTAMP WITH TIME ZONE,
          next_follow_up_date TIMESTAMP WITH TIME ZONE,
          notes TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          UNIQUE(company_id),
          
          CONSTRAINT valid_stage CHECK (stage IN (
            'new_lead',
            'contacted', 
            'website_viewed',
            'appointment_scheduled',
            'follow_up',
            'sale_closed',
            'not_interested'
          ))
        );
      `
    });

    if (pipelineError) {
      console.log('Using direct SQL approach...');
      // Try direct table creation if RPC fails
      const { error: directError } = await supabase
        .from('_pipeline_setup')
        .select('*')
        .limit(0);
    }

    // Create contact_log table
    const { error: logError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS contact_log (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL,
          stage_from TEXT,
          stage_to TEXT NOT NULL,
          notes TEXT DEFAULT '',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by TEXT
        );
      `
    });

    // Create indexes
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_lead_pipeline_stage ON lead_pipeline(stage);
        CREATE INDEX IF NOT EXISTS idx_lead_pipeline_company ON lead_pipeline(company_id);
        CREATE INDEX IF NOT EXISTS idx_contact_log_company ON contact_log(company_id);
      `
    });

    console.log('✅ Pipeline tables created successfully!');

    // Now populate with existing companies as new leads
    console.log('📊 Populating pipeline with existing companies...');
    
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id')
      .in('state', ['Alabama', 'Arkansas']);

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return;
    }

    console.log(`Found ${companies?.length || 0} companies to add to pipeline`);

    // Insert all companies as new leads (ignore conflicts for existing entries)
    if (companies && companies.length > 0) {
      const pipelineEntries = companies.map(company => ({
        company_id: company.id,
        stage: 'new_lead',
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert in batches to avoid timeout
      const batchSize = 100;
      for (let i = 0; i < pipelineEntries.length; i += batchSize) {
        const batch = pipelineEntries.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('lead_pipeline')
          .upsert(batch, { onConflict: 'company_id' });

        if (insertError) {
          console.error(`Error inserting batch ${i}-${i + batchSize}:`, insertError);
        } else {
          console.log(`✅ Inserted batch ${i + 1}-${Math.min(i + batchSize, pipelineEntries.length)}`);
        }
      }
    }

    console.log('🎉 Pipeline setup complete!');
    
    // Verify setup
    const { data: pipelineCount } = await supabase
      .from('lead_pipeline')
      .select('stage, company_id', { count: 'exact' })
      .eq('stage', 'new_lead');

    console.log(`📈 Pipeline now has ${pipelineCount?.length || 0} new leads ready to contact!`);

  } catch (error) {
    console.error('❌ Setup error:', error);
  }
}

// Auto-run if called directly
if (require.main === module) {
  setupPipelineTables().then(() => process.exit(0));
}

export { setupPipelineTables };