import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
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

      // Get threads with latest message info
      const { data: threads, error } = await supabase
        .from('admin_threads')
        .select(`
          *,
          admin_messages!inner(
            id,
            kind,
            created_at,
            author_id,
            is_starred
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching threads:', error);
        return res.status(500).json({ error: 'Failed to fetch threads' });
      }

      // Process threads to include latest message info
      const processedThreads = threads.map(thread => {
        const messages = thread.admin_messages as any[];
        const latestMessage = messages.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          ...thread,
          latest_message: latestMessage,
          message_count: messages.length,
          has_unread: false // TODO: implement unread tracking
        };
      });

      res.status(200).json({ threads: processedThreads });
    } catch (error) {
      console.error('Threads API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    try {
      const { subject, company_id, shared } = req.body;

      if (!subject) {
        return res.status(400).json({ error: 'Subject is required' });
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

      // Create new thread
      const { data: thread, error } = await supabase
        .from('admin_threads')
        .insert({
          subject,
          company_id,
          shared: shared || false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating thread:', error);
        return res.status(500).json({ error: 'Failed to create thread' });
      }

      res.status(201).json({ thread });
    } catch (error) {
      console.error('Create thread API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}