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

      // Get notes for the lead
      const { data: notes, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notes:', error);
        return res.status(500).json({ error: 'Failed to fetch notes' });
      }

      res.status(200).json(notes || []);
    } else if (req.method === 'POST') {
      const { lead_id, content, is_private = false } = req.body;

      if (!lead_id || !content || content.trim() === '') {
        return res.status(400).json({ error: 'Lead ID and content are required' });
      }

      // Insert new note
      const { data: note, error } = await supabase
        .from('lead_notes')
        .insert({
          lead_id,
          content: content.trim(),
          is_private,
          created_by: 'admin' // TODO: Get from auth context
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating note:', error);
        return res.status(500).json({ error: 'Failed to create note' });
      }

      res.status(201).json(note);
    } else if (req.method === 'PUT') {
      const { id, content, is_private } = req.body;

      if (!id || !content || content.trim() === '') {
        return res.status(400).json({ error: 'Note ID and content are required' });
      }

      // Update existing note
      const { data: note, error } = await supabase
        .from('lead_notes')
        .update({
          content: content.trim(),
          is_private,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating note:', error);
        return res.status(500).json({ error: 'Failed to update note' });
      }

      if (!note) {
        return res.status(404).json({ error: 'Note not found' });
      }

      res.status(200).json(note);
    } else if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Note ID is required' });
      }

      // Delete note
      const { error } = await supabase
        .from('lead_notes')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting note:', error);
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