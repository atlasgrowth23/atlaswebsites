import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid lead ID' });
  }

  try {
    if (req.method === 'GET') {
      // Get lead details - use basic fields first, then try extended fields
      let { data: lead, error } = await supabase
        .from('leads')
        .select('id, notes, stage, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching basic lead details:', error);
        return res.status(500).json({ error: 'Failed to fetch lead details' });
      }

      if (!lead) {
        return res.status(404).json({ error: 'Lead not found' });
      }

      // Try to get extended fields, but don't fail if they don't exist
      try {
        const { data: extendedLead } = await supabase
          .from('leads')
          .select(`
            owner_name,
            software_used,
            interest_level,
            estimated_value,
            best_contact_time,
            qualification_checklist,
            next_followup_date
          `)
          .eq('id', id)
          .single();

        if (extendedLead) {
          lead = { ...lead, ...extendedLead };
        }
      } catch (extendedError) {
        console.log('Extended fields not available yet, using basic lead data');
      }

      res.status(200).json(lead);
    } else if (req.method === 'PUT') {
      // Update lead details
      const {
        owner_name,
        software_used,
        interest_level,
        estimated_value,
        best_contact_time,
        qualification_checklist,
        next_followup_date
      } = req.body;

      const updateData: any = {};
      
      if (owner_name !== undefined) updateData.owner_name = owner_name;
      if (software_used !== undefined) updateData.software_used = software_used;
      if (interest_level !== undefined) updateData.interest_level = interest_level;
      if (estimated_value !== undefined) updateData.estimated_value = estimated_value;
      if (best_contact_time !== undefined) updateData.best_contact_time = best_contact_time;
      if (qualification_checklist !== undefined) updateData.qualification_checklist = qualification_checklist;
      if (next_followup_date !== undefined) updateData.next_followup_date = next_followup_date;

      const { data: updatedLead, error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id)
        .select(`
          id,
          owner_name,
          software_used,
          interest_level,
          estimated_value,
          best_contact_time,
          qualification_checklist,
          next_followup_date
        `)
        .single();

      if (error) {
        console.error('Error updating lead details:', error);
        return res.status(500).json({ error: 'Failed to update lead details' });
      }

      // Log activity for significant updates
      const significantUpdates = [];
      if (owner_name !== undefined && owner_name) significantUpdates.push(`Owner: ${owner_name}`);
      if (software_used !== undefined && software_used) significantUpdates.push(`Software: ${software_used}`);
      if (interest_level !== undefined) significantUpdates.push(`Interest Level: ${interest_level}/5`);
      if (estimated_value !== undefined && estimated_value) significantUpdates.push(`Est. Value: $${estimated_value}`);

      if (significantUpdates.length > 0) {
        await supabase
          .from('lead_activity')
          .insert({
            lead_id: id,
            activity_type: 'note',
            description: `Updated details: ${significantUpdates.join(', ')}`,
            metadata: { type: 'system_update', updates: updateData }
          });
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