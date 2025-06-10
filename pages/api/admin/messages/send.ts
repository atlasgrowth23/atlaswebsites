import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { thread_id, body_html, kind, is_note } = req.body;

    if (!thread_id || !body_html) {
      return res.status(400).json({ error: 'Thread ID and body are required' });
    }

    // Get current user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Determine message kind
    const messageKind = is_note ? 'note' : 'email';

    // Create message
    const { data: message, error } = await supabase
      .from('admin_messages')
      .insert({
        thread_id,
        kind: messageKind,
        author_id: user.id,
        body_html,
        gmail_thread_id: messageKind === 'email' ? null : null // TODO: implement Gmail API
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating message:', error);
      return res.status(500).json({ error: 'Failed to create message' });
    }

    // Update thread timestamp
    await supabase
      .from('admin_threads')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', thread_id);

    // TODO: If this is an email (not a note), send via Gmail API
    if (messageKind === 'email') {
      // Implement Gmail sending logic here
      console.log('TODO: Send email via Gmail API');
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}