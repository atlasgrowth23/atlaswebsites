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
    const { conversationId, visitorId, companyId } = req.query;

    if (!conversationId && !visitorId) {
      return res.status(400).json({ error: 'Either conversationId or visitorId is required' });
    }

    let query = supabase
      .from('chat_messages')
      .select(`
        id,
        message,
        is_from_visitor,
        message_type,
        created_at,
        conversation_id
      `)
      .order('created_at', { ascending: true });

    // Filter by conversation ID or visitor ID
    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    } else if (visitorId && companyId) {
      // Get all messages for this visitor and company
      query = query.eq('visitor_id', visitorId).eq('company_id', companyId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching conversation:', error);
      return res.status(500).json({ error: 'Failed to fetch conversation' });
    }

    // Get conversation details if we have a conversation ID
    let conversationDetails = null;
    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select(`
          id,
          status,
          started_at,
          last_message_at,
          contact_id,
          contacts (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('id', conversationId)
        .single();

      if (!convError) {
        conversationDetails = conversation;
      }
    }

    res.status(200).json({
      success: true,
      messages: messages || [],
      conversation: conversationDetails,
      messageCount: messages?.length || 0
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}