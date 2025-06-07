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
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    // Get conversations with contact info and latest message
    const { data: conversations, error } = await supabaseAdmin
      .from('tk_conversations')
      .select(`
        id,
        last_message_at,
        created_at,
        tk_contacts!inner (
          id,
          name,
          email,
          phone
        ),
        tk_messages (
          id,
          message,
          created_at,
          is_from_visitor
        )
      `)
      .eq('company_id', companyId)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return res.status(500).json({ error: 'Failed to fetch conversations' });
    }

    // Format conversations data
    const formattedConversations = conversations?.map(conv => {
      const contact = Array.isArray(conv.tk_contacts) ? conv.tk_contacts[0] : conv.tk_contacts;
      const messages = Array.isArray(conv.tk_messages) ? conv.tk_messages : [];
      const lastMessage = messages.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        id: conv.id,
        contact_name: contact?.name || 'Unknown Contact',
        contact_email: contact?.email || null,
        contact_phone: contact?.phone || null,
        last_message: lastMessage?.message || 'No messages yet',
        last_message_at: conv.last_message_at,
        unread_count: 0 // You can implement unread counting logic here
      };
    }) || [];

    res.status(200).json({ conversations: formattedConversations });

  } catch (error) {
    console.error('Error in conversations API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}