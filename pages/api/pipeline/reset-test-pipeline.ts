import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Starting test pipeline reset...');

    // Get all test leads
    const { data: testLeads, error: testLeadsError } = await supabaseAdmin
      .from('lead_pipeline')
      .select(`
        id,
        company_id,
        companies!inner(name)
      `)
      .eq('pipeline_type', 'atlas_test_pipeline');

    if (testLeadsError) {
      console.error('Error fetching test leads:', testLeadsError);
      return res.status(500).json({ error: 'Failed to fetch test leads' });
    }

    if (!testLeads || testLeads.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No test leads found to reset',
        resetsPerformed: 0
      });
    }

    const leadIds = testLeads.map(lead => lead.id);
    const companyIds = testLeads.map(lead => lead.company_id);

    let resetsPerformed = 0;

    // 1. Clear activity logs
    const { error: activityError } = await supabaseAdmin
      .from('activity_log')
      .delete()
      .in('lead_id', leadIds);

    if (activityError) {
      console.error('Error clearing activity logs:', activityError);
    } else {
      resetsPerformed++;
    }

    // 2. Clear tags
    const { error: tagsError } = await supabaseAdmin
      .from('lead_tags')
      .delete()
      .in('lead_id', leadIds);

    if (tagsError) {
      console.error('Error clearing tags:', tagsError);
    } else {
      resetsPerformed++;
    }

    // 3. Clear appointments
    const { error: appointmentsError } = await supabaseAdmin
      .from('appointments')
      .delete()
      .in('lead_id', leadIds);

    if (appointmentsError) {
      console.error('Error clearing appointments:', appointmentsError);
    } else {
      resetsPerformed++;
    }

    // 4. Clear template views (website visits)
    const { error: viewsError } = await supabaseAdmin
      .from('template_views')
      .delete()
      .in('company_id', companyIds);

    if (viewsError) {
      console.error('Error clearing template views:', viewsError);
    } else {
      resetsPerformed++;
    }

    // 5. Clear contact logs
    const { error: contactError } = await supabaseAdmin
      .from('contact_log')
      .delete()
      .in('company_id', companyIds);

    if (contactError) {
      console.error('Error clearing contact logs:', contactError);
    }

    // 6. Reset leads to new_lead stage
    const { error: stageError } = await supabaseAdmin
      .from('lead_pipeline')
      .update({
        stage: 'new_lead',
        notes: '',
        last_contact_date: null,
        next_follow_up_date: null,
        updated_at: new Date().toISOString()
      })
      .in('id', leadIds);

    if (stageError) {
      console.error('Error resetting stages:', stageError);
      return res.status(500).json({ error: 'Failed to reset pipeline stages' });
    }

    // 7. Reset company tracking
    const { error: trackingError } = await supabaseAdmin
      .from('companies')
      .update({
        tracking_enabled: true,
        tracking_paused: false
      })
      .in('id', companyIds);

    if (trackingError) {
      console.error('Error resetting company tracking:', trackingError);
    }

    console.log(`✅ Test pipeline reset complete. Reset ${testLeads.length} leads.`);

    return res.status(200).json({
      success: true,
      message: `Successfully reset ${testLeads.length} test leads`,
      leadsReset: testLeads.length,
      resetOperations: resetsPerformed,
      leads: testLeads.map(lead => ({
        name: lead.companies.name,
        status: 'reset_to_new_lead'
      }))
    });

  } catch (error) {
    console.error('Test pipeline reset error:', error);
    return res.status(500).json({ 
      error: 'Failed to reset test pipeline',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
}