import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { threadId } = req.query;

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

      // Get thread details
      const { data: thread, error: threadError } = await supabase
        .from('admin_threads')
        .select('*')
        .eq('id', threadId)
        .single();

      if (threadError || !thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      // Get messages for this thread
      const { data: messages, error: messagesError } = await supabase
        .from('admin_messages')
        .select(`
          *,
          author:auth.users!admin_messages_author_id_fkey(
            email,
            raw_user_meta_data
          )
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      res.status(200).json({ 
        thread,
        messages: messages || []
      });
    } catch (error) {
      console.error('Thread messages API error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}