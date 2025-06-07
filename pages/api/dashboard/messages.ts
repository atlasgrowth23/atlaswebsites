import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { companyId } = req.query;

    if (!companyId || typeof companyId !== 'string') {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Get all chat messages for this company
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('id, message, is_from_visitor, created_at, visitor_id, conversation_id')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(100); // Limit to last 100 messages

    if (error) {
      console.error('Error fetching messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    res.status(200).json({
      success: true,
      messages: messages || []
    });

  } catch (error) {
    console.error('Messages API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}