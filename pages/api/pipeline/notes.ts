import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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

      // Handle temporary lead IDs (companies without pipeline entries)
      if (leadId.startsWith('temp_')) {
        // Return empty array for temp leads (no notes yet)
        return res.status(200).json([]);
      }

      // 🆕 NEW: Get notes from JSON column in lead_pipeline
      const { data: pipelineData, error: pipelineError } = await supabase
        .from('lead_pipeline')
        .select('notes_json')
        .eq('id', leadId)
        .single();

      if (pipelineError) {
        console.error('Error fetching pipeline data:', pipelineError);
        // 🛡️ FALLBACK: Try old lead_notes table if new structure fails
        console.log('Falling back to old lead_notes table...');
        const { data: notes, error: fallbackError } = await supabase
          .from('lead_notes')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false });

        if (fallbackError) {
          return res.status(500).json({ error: 'Failed to fetch notes' });
        }
        return res.status(200).json(notes || []);
      }

      // Return notes from JSON column
      const notes = pipelineData?.notes_json || [];
      res.status(200).json(notes);

    } else if (req.method === 'POST') {
      const { lead_id, content, is_private = false, created_by } = req.body;

      if (!lead_id || !content || content.trim() === '') {
        return res.status(400).json({ error: 'Lead ID and content are required' });
      }

      let actualLeadId = lead_id;

      // Handle temporary lead IDs - create pipeline entry first
      if (lead_id.startsWith('temp_')) {
        const companyId = lead_id.replace('temp_', '');
        
        // Check if pipeline entry already exists
        const { data: existingEntry } = await supabase
          .from('lead_pipeline')
          .select('id')
          .eq('company_id', companyId)
          .single();
        
        if (existingEntry) {
          actualLeadId = existingEntry.id;
        } else {
          // Get company info to determine pipeline_type
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('state, site')
            .eq('id', companyId)
            .single();

          if (companyError || !company) {
            return res.status(404).json({ error: 'Company not found' });
          }

          // Determine pipeline type based on state and website status
          let pipelineType = '';
          const hasWebsite = company.site && company.site.trim() !== '';
          if (company.state === 'Alabama') {
            pipelineType = hasWebsite ? 'has_website_alabama' : 'no_website_alabama';
          } else if (company.state === 'Arkansas') {
            pipelineType = hasWebsite ? 'has_website_arkansas' : 'no_website_arkansas';
          } else {
            return res.status(400).json({ error: 'Company must be in Alabama or Arkansas' });
          }

          // Create pipeline entry with empty JSON arrays
          const { data: pipelineEntry, error: pipelineError } = await supabase
            .from('lead_pipeline')
            .insert({
              company_id: companyId,
              stage: 'new_lead',
              pipeline_type: pipelineType,
              notes: '',
              notes_json: [], // 🆕 Initialize empty JSON array
              tags: [], // 🆕 Initialize empty tags array
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('*')
            .single();

          if (pipelineError) {
            console.error('Error creating pipeline entry:', pipelineError);
            return res.status(500).json({ error: 'Failed to create pipeline entry' });
          }

          actualLeadId = pipelineEntry.id;
        }
      }

      // 🆕 NEW: Create note object and add to JSON array
      const newNote = {
        id: uuidv4(),
        content: content.trim(),
        is_private,
        created_by: created_by || 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Get current notes JSON array
      const { data: currentPipeline, error: getCurrentError } = await supabase
        .from('lead_pipeline')
        .select('notes_json')
        .eq('id', actualLeadId)
        .single();

      if (getCurrentError) {
        console.error('Error getting current notes:', getCurrentError);
        return res.status(500).json({ error: 'Failed to get current notes' });
      }

      // Add new note to beginning of array (most recent first)
      const currentNotes = currentPipeline?.notes_json || [];
      const updatedNotes = [newNote, ...currentNotes];

      // Update the JSON array
      const { error: updateError } = await supabase
        .from('lead_pipeline')
        .update({
          notes_json: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', actualLeadId);

      if (updateError) {
        console.error('Error updating notes JSON:', updateError);
        // 🛡️ FALLBACK: Try old method if new method fails
        console.log('Falling back to old lead_notes table...');
        const { data: note, error: fallbackError } = await supabase
          .from('lead_notes')
          .insert({
            lead_id: actualLeadId,
            content: content.trim(),
            is_private,
            created_by: created_by || 'admin'
          })
          .select('*')
          .single();

        if (fallbackError) {
          return res.status(500).json({ error: 'Failed to create note' });
        }
        return res.status(201).json(note);
      }

      res.status(201).json(newNote);

    } else if (req.method === 'PUT') {
      const { id, content, is_private, lead_id } = req.body;

      if (!id || !content || content.trim() === '') {
        return res.status(400).json({ error: 'Note ID and content are required' });
      }

      if (!lead_id) {
        return res.status(400).json({ error: 'Lead ID is required for note updates' });
      }

      // 🆕 NEW: Update note in JSON array
      const { data: currentPipeline, error: getCurrentError } = await supabase
        .from('lead_pipeline')
        .select('notes_json')
        .eq('id', lead_id)
        .single();

      if (getCurrentError) {
        console.error('Error getting current notes for update:', getCurrentError);
        return res.status(500).json({ error: 'Failed to get current notes' });
      }

      const currentNotes = currentPipeline?.notes_json || [];
      const noteIndex = currentNotes.findIndex((note: any) => note.id === id);

      if (noteIndex === -1) {
        // 🛡️ FALLBACK: Try old method if note not found in JSON
        const { data: note, error: fallbackError } = await supabase
          .from('lead_notes')
          .update({
            content: content.trim(),
            is_private,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select('*')
          .single();

        if (fallbackError || !note) {
          return res.status(404).json({ error: 'Note not found' });
        }
        return res.status(200).json(note);
      }

      // Update the note in the array
      const updatedNotes = [...currentNotes];
      updatedNotes[noteIndex] = {
        ...updatedNotes[noteIndex],
        content: content.trim(),
        is_private,
        updated_at: new Date().toISOString()
      };

      // Save updated array
      const { error: updateError } = await supabase
        .from('lead_pipeline')
        .update({
          notes_json: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead_id);

      if (updateError) {
        console.error('Error updating notes JSON:', updateError);
        return res.status(500).json({ error: 'Failed to update note' });
      }

      res.status(200).json(updatedNotes[noteIndex]);

    } else if (req.method === 'DELETE') {
      const { id, lead_id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Note ID is required' });
      }

      if (!lead_id) {
        return res.status(400).json({ error: 'Lead ID is required for note deletion' });
      }

      // 🆕 NEW: Remove note from JSON array
      const { data: currentPipeline, error: getCurrentError } = await supabase
        .from('lead_pipeline')
        .select('notes_json')
        .eq('id', lead_id)
        .single();

      if (getCurrentError) {
        console.error('Error getting current notes for deletion:', getCurrentError);
        return res.status(500).json({ error: 'Failed to get current notes' });
      }

      const currentNotes = currentPipeline?.notes_json || [];
      const updatedNotes = currentNotes.filter((note: any) => note.id !== id);

      if (updatedNotes.length === currentNotes.length) {
        // Note not found in JSON, try old method
        const { error: fallbackError } = await supabase
          .from('lead_notes')
          .delete()
          .eq('id', id);

        if (fallbackError) {
          return res.status(500).json({ error: 'Failed to delete note' });
        }
        return res.status(200).json({ success: true });
      }

      // Save updated array
      const { error: updateError } = await supabase
        .from('lead_pipeline')
        .update({
          notes_json: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead_id);

      if (updateError) {
        console.error('Error updating notes JSON after deletion:', updateError);
        return res.status(500).json({ error: 'Failed to delete note' });
      }

      res.status(200).json({ success: true });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}