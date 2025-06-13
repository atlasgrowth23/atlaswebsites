import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { leadId } = req.query;

      if (!leadId || typeof leadId !== 'string') {
        return res.status(400).json({ error: 'Invalid lead ID' });
      }

      // Get notes from companies table via lead's company_id
      const { data: lead, error: leadError } = await supabase
        .from('lead_pipeline')
        .select('company_id')
        .eq('id', leadId)
        .single();

      if (leadError) {
        console.error('Error fetching lead:', leadError);
        return res.status(500).json({ error: 'Failed to fetch lead' });
      }

      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('notes')
        .eq('id', lead.company_id)
        .single();

      if (companyError) {
        console.error('Error fetching company notes:', companyError);
        return res.status(500).json({ error: 'Failed to fetch notes' });
      }

      // Convert notes text to simple array format for compatibility
      const notesText = company?.notes || '';
      const notes = notesText ? [{
        id: 'company-notes',
        content: notesText,
        created_at: new Date().toISOString(),
        created_by: 'system',
        is_private: false
      }] : [];

      res.status(200).json(notes);

    } else if (req.method === 'POST') {
      const { lead_id, content, created_by } = req.body;

      if (!lead_id || !content || content.trim() === '') {
        return res.status(400).json({ error: 'Lead ID and content are required' });
      }

      // Get the company_id from the lead
      const { data: lead, error: leadError } = await supabase
        .from('lead_pipeline')
        .select('company_id')
        .eq('id', lead_id)
        .single();

      if (leadError) {
        console.error('Error fetching lead:', leadError);
        return res.status(500).json({ error: 'Failed to fetch lead' });
      }

      // Get current notes from companies table
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('notes')
        .eq('id', lead.company_id)
        .single();

      if (companyError) {
        console.error('Error fetching company:', companyError);
        return res.status(500).json({ error: 'Failed to fetch company' });
      }

      // Append new note to existing notes
      const timestamp = new Date().toLocaleString();
      const author = created_by || 'admin';
      const newNote = `${timestamp} (${author}): ${content.trim()}`;
      
      const existingNotes = company?.notes || '';
      const updatedNotes = existingNotes 
        ? `${existingNotes}\n\n${newNote}`
        : newNote;

      // Update companies table
      const { error: updateError } = await supabase
        .from('companies')
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.company_id);

      if (updateError) {
        console.error('Error updating company notes:', updateError);
        return res.status(500).json({ error: 'Failed to save note' });
      }

      console.log(`✅ Added note to company ${lead.company_id}: ${content.trim()}`);

      const responseNote = {
        id: `note-${Date.now()}`,
        content: content.trim(),
        created_at: new Date().toISOString(),
        created_by: author,
        is_private: false
      };

      res.status(201).json(responseNote);

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}