import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🆕 MODERNIZED LEAD DETAILS API (Phase 3 Step 3)
// Now uses lead_pipeline table with JSON structure for notes and tags
// Provides comprehensive lead data with business owner info
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid lead ID' });
  }

  try {
    if (req.method === 'GET') {
      // 🆕 MODERNIZED: Get lead details from lead_pipeline
      const { data: lead, error } = await supabase
        .from('lead_pipeline')
        .select(`
          *,
          notes_json,
          tags
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching lead details:', error);
        // 🛡️ FALLBACK: Try old leads table if new structure fails
        console.log('Falling back to old leads table...');
        const { data: oldLead, error: oldError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', id)
          .single();
          
        if (oldError || !oldLead) {
          return res.status(404).json({ error: 'Lead not found' });
        }
        return res.status(200).json(oldLead);
      }

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // 🆕 ENHANCED: Get company data separately
      const { data: company } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          slug,
          city,
          state,
          phone,
          email_1,
          email_2,
          site,
          tracking_enabled,
          rating,
          reviews,
          reviews_link,
          r_30,
          r_60,
          r_90,
          r_365,
          predicted_label,
          first_review_date
        `)
        .eq('id', lead.company_id)
        .single();

      // 🆕 ENHANCED: Get business owner info for this company
      const { data: businessOwner } = await supabase
        .from('business_owners')
        .select('*')
        .eq('company_id', lead.company_id)
        .single();

      // 🆕 ENHANCED: Structure the response with rich data
      const enhancedLead = {
        id: lead.id,
        company_id: lead.company_id,
        stage: lead.stage,
        pipeline_type: lead.pipeline_type,
        last_contact_date: lead.last_contact_date,
        next_follow_up_date: lead.next_follow_up_date,
        notes: lead.notes || '', // Legacy field
        notes_json: lead.notes_json || [], // 🆕 JSON notes array
        notes_count: (lead.notes_json || []).length,
        tags: lead.tags || [], // 🆕 Tags array
        tags_count: (lead.tags || []).length,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        
        // 🆕 Company information embedded
        company: company,
        
        // 🆕 Business owner information
        business_owner: businessOwner ? {
          id: businessOwner.id,
          name: businessOwner.name,
          email: businessOwner.email,
          phone: businessOwner.phone,
          title: businessOwner.title,
          contact_preference: businessOwner.contact_preference,
          best_contact_time: businessOwner.best_contact_time,
          notes: businessOwner.notes
        } : null,
        
        // 🆕 Quick stats for UI
        stats: {
          total_notes: (lead.notes_json || []).length,
          total_tags: (lead.tags || []).length,
          recent_activity: lead.updated_at,
          pipeline_position: lead.stage,
          has_contact_info: !!businessOwner,
          has_recent_notes: (lead.notes_json || []).length > 0 && 
            new Date(lead.notes_json[0]?.created_at || 0) > new Date(Date.now() - 7*24*60*60*1000)
        }
      };

      res.status(200).json(enhancedLead);
    } else if (req.method === 'PUT') {
      // 🆕 MODERNIZED: Update lead details in lead_pipeline
      const {
        stage,
        last_contact_date,
        next_follow_up_date,
        pipeline_type,
        business_owner_info // New: for updating business owner data
      } = req.body;

      const updateData: any = { updated_at: new Date().toISOString() };
      
      if (stage !== undefined) updateData.stage = stage;
      if (last_contact_date !== undefined) updateData.last_contact_date = last_contact_date;
      if (next_follow_up_date !== undefined) updateData.next_follow_up_date = next_follow_up_date;
      if (pipeline_type !== undefined) updateData.pipeline_type = pipeline_type;

      // Update lead_pipeline table
      const { data: updatedLead, error } = await supabase
        .from('lead_pipeline')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating lead details:', error);
        return res.status(500).json({ error: 'Failed to update lead details' });
      }

      // 🆕 NEW: Update business owner info if provided
      if (business_owner_info && updatedLead) {
        const { data: existingOwner } = await supabase
          .from('business_owners')
          .select('id')
          .eq('company_id', updatedLead.company_id)
          .single();

        if (existingOwner) {
          // Update existing business owner
          await supabase
            .from('business_owners')
            .update({
              ...business_owner_info,
              updated_at: new Date().toISOString()
            })
            .eq('company_id', updatedLead.company_id);
        } else {
          // Create new business owner record
          await supabase
            .from('business_owners')
            .insert({
              company_id: updatedLead.company_id,
              ...business_owner_info,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }
      }

      // 🆕 ENHANCED: Log activity as a note in JSON structure
      const significantUpdates = [];
      if (stage !== undefined) significantUpdates.push(`Stage: ${stage}`);
      if (last_contact_date !== undefined) significantUpdates.push(`Last Contact: ${last_contact_date}`);
      if (next_follow_up_date !== undefined) significantUpdates.push(`Next Follow-up: ${next_follow_up_date}`);
      if (business_owner_info?.name) significantUpdates.push(`Owner: ${business_owner_info.name}`);

      if (significantUpdates.length > 0) {
        // Add system note to JSON notes array
        const { data: currentLead } = await supabase
          .from('lead_pipeline')
          .select('notes_json')
          .eq('id', id)
          .single();

        const currentNotes = currentLead?.notes_json || [];
        const systemNote = {
          id: `system-${Date.now()}`,
          content: `🔧 System update: ${significantUpdates.join(', ')}`,
          is_private: false,
          created_by: 'system',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          type: 'system_update'
        };

        const updatedNotes = [systemNote, ...currentNotes];
        
        await supabase
          .from('lead_pipeline')
          .update({
            notes_json: updatedNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);
      }

      res.status(200).json(updatedLead);
    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}