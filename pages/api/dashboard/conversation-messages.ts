import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationId } = req.query;

    if (!conversationId) {
      return res.status(400).json({ error: 'Conversation ID is required' });
    }

    // Get messages for the conversation
    const { data: messages, error } = await supabaseAdmin
      .from('tk_messages')
      .select(`
        id,
        message,
        is_from_visitor,
        created_at,
        message_type,
        tk_contacts (
          name,
          email,
          phone
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching conversation messages:', error);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    // Format messages data
    const formattedMessages = messages?.map(msg => {
      const contact = Array.isArray(msg.tk_contacts) ? msg.tk_contacts[0] : msg.tk_contacts;
      
      return {
        id: msg.id,
        message: msg.message,
        is_from_visitor: msg.is_from_visitor,
        created_at: msg.created_at,
        visitor_id: '', // Legacy field
        conversation_id: conversationId,
        contact_name: contact?.name || null,
        contact_email: contact?.email || null,
        contact_phone: contact?.phone || null
      };
    }) || [];

    res.status(200).json({ messages: formattedMessages });

  } catch (error) {
    console.error('Error in conversation-messages API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}