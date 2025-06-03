import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🏗️  Setting up pipeline tables...');

    // Get all companies first to see what we're working with
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, state')
      .in('state', ['Alabama', 'Arkansas']);

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return res.status(500).json({ error: 'Failed to fetch companies' });
    }

    console.log(`Found ${companies?.length || 0} companies in Alabama/Arkansas`);

    // Check if pipeline table exists by trying to query it
    const { data: existingPipeline, error: pipelineCheckError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('id')
      .limit(1);

    let tablesExist = !pipelineCheckError;

    if (!tablesExist) {
      console.log('Pipeline tables do not exist, they will be created automatically on first insert');
    }

    // Insert all companies as new leads
    if (companies && companies.length > 0) {
      console.log('📊 Adding companies to pipeline...');
      
      const pipelineEntries = companies.map(company => ({
        company_id: company.id,
        stage: 'new_lead',
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert in smaller batches
      const batchSize = 50;
      let totalInserted = 0;
      
      for (let i = 0; i < pipelineEntries.length; i += batchSize) {
        const batch = pipelineEntries.slice(i, i + batchSize);
        
        const { data: insertData, error: insertError } = await supabaseAdmin
          .from('lead_pipeline')
          .upsert(batch, { 
            onConflict: 'company_id',
            ignoreDuplicates: true 
          })
          .select('id');

        if (insertError) {
          console.error(`Error inserting batch ${i}-${i + batchSize}:`, insertError);
          // Continue with other batches
        } else {
          totalInserted += insertData?.length || 0;
          console.log(`✅ Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pipelineEntries.length/batchSize)}`);
        }
      }

      console.log(`✅ Pipeline setup complete! Added ${totalInserted} companies`);
    }

    // Verify final count
    const { data: finalCount, error: countError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('stage, company_id', { count: 'exact' })
      .eq('stage', 'new_lead');

    const newLeadCount = finalCount?.length || 0;

    res.status(200).json({
      success: true,
      message: 'Pipeline setup complete',
      totalCompanies: companies?.length || 0,
      newLeads: newLeadCount,
      tablesExisted: tablesExist
    });

  } catch (error) {
    console.error('❌ Setup error:', error);
    res.status(500).json({ error: 'Pipeline setup failed' });
  }
}