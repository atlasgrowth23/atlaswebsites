import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

// 🆕 MODERNIZED LEADS API (Phase 3 Step 2)
// Now includes JSON notes and tags data in response for better performance
// Provides notes_count, recent_note preview, and tags_count for UI efficiency
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pipeline_type } = req.query;
    
    // Default to 'no_website_alabama' if no pipeline type specified
    const selectedPipelineType = pipeline_type || 'no_website_alabama';
    
    console.log(`🔍 Loading pipeline: ${selectedPipelineType}`);
    
    // 🆕 MODERNIZED: Get pipeline data with new JSON structure
    const { data: pipelineEntries, error: pipelineError } = await supabaseAdmin
      .from('lead_pipeline')
      .select(`
        *,
        notes_json,
        tags
      `)
      .eq('pipeline_type', selectedPipelineType)
      .order('updated_at', { ascending: false });

    if (pipelineError) {
      console.error('Pipeline error:', pipelineError);
      return res.status(500).json({ error: 'Failed to fetch pipeline data' });
    }

    console.log(`📊 Found ${pipelineEntries?.length || 0} pipeline entries`);

    if (!pipelineEntries || pipelineEntries.length === 0) {
      return res.status(200).json({ 
        leads: [], 
        pipeline_type: selectedPipelineType,
        pipeline_stats: {}
      });
    }

    // Get company IDs
    const companyIds = pipelineEntries.map(entry => entry.company_id);
    
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .in('id', companyIds);

    if (companiesError) {
      console.error('Companies error:', companiesError);
      return res.status(500).json({ error: 'Failed to fetch companies' });
    }

    // Create company lookup map
    const companyMap = new Map();
    companies?.forEach(company => {
      companyMap.set(company.id, company);
    });

    // 🆕 MODERNIZED: Transform data with new JSON structure
    const leads = pipelineEntries.map(entry => {
      const company = companyMap.get(entry.company_id);
      
      // Extract notes and tags from JSON, with fallback to legacy fields
      const notes_list = entry.notes_json || [];
      const tags_list = entry.tags || [];
      const notes_count = notes_list.length;
      const recent_note = notes_list.length > 0 ? notes_list[0]?.content?.substring(0, 100) : null;
      
      return {
        id: entry.id,
        company_id: entry.company_id,
        stage: entry.stage,
        last_contact_date: entry.last_contact_date,
        next_follow_up_date: entry.next_follow_up_date,
        notes: entry.notes || '', // Legacy field for backward compatibility
        notes_json: notes_list, // 🆕 New JSON notes array
        notes_count, // 🆕 Quick count for UI
        recent_note, // 🆕 Preview of most recent note
        tags: tags_list, // 🆕 Tags array
        tags_count: tags_list.length, // 🆕 Quick count for UI
        created_at: entry.created_at,
        updated_at: entry.updated_at,
        pipeline_type: entry.pipeline_type,
        company: {
          id: company?.id,
          name: company?.name,
          slug: company?.slug,
          city: company?.city,
          state: company?.state,
          phone: company?.phone,
          email_1: company?.email_1,
          site: company?.site,
          tracking_enabled: company?.tracking_enabled,
          rating: company?.rating,
          reviews: company?.reviews,
          reviews_link: company?.reviews_link,
          first_review_date: company?.first_review_date,
          r_30: company?.r_30,
          r_60: company?.r_60,
          r_90: company?.r_90,
          r_365: company?.r_365,
          predicted_label: company?.predicted_label
        }
      };
    });

    // Get pipeline stats for the response
    const { data: allPipelines } = await supabaseAdmin
      .from('lead_pipeline')
      .select('pipeline_type')
      .not('pipeline_type', 'is', null);

    const pipelineStats: Record<string, number> = {};
    if (allPipelines) {
      allPipelines.forEach(entry => {
        pipelineStats[entry.pipeline_type] = (pipelineStats[entry.pipeline_type] || 0) + 1;
      });
    }

    console.log(`✅ Returning ${leads.length} leads for ${selectedPipelineType}`);

    res.status(200).json({ 
      leads, 
      pipeline_type: selectedPipelineType,
      pipeline_stats: pipelineStats
    });
  } catch (error) {
    console.error('Pipeline leads error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}