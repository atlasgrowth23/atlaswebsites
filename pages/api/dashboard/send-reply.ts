import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversationId, message, companyId } = req.body;

    if (!conversationId || !message || !companyId) {
      return res.status(400).json({ error: 'Conversation ID, message, and company ID are required' });
    }

    // Get conversation details to find contact_id
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('tk_conversations')
      .select('contact_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      console.error('Error fetching conversation:', convError);
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Create reply message
    const { data: newMessage, error: messageError } = await supabaseAdmin
      .from('tk_messages')
      .insert([
        {
          conversation_id: conversationId,
          contact_id: conversation.contact_id,
          company_id: companyId,
          message: message.trim(),
          is_from_visitor: false,
          message_type: 'text',
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return res.status(500).json({ error: 'Failed to send message' });
    }

    // Update conversation last_message_at
    await supabaseAdmin
      .from('tk_conversations')
      .update({ 
        last_message_at: new Date().toISOString() 
      })
      .eq('id', conversationId);

    res.status(200).json({ 
      success: true, 
      message: {
        id: newMessage.id,
        message: newMessage.message,
        is_from_visitor: newMessage.is_from_visitor,
        created_at: newMessage.created_at
      }
    });

  } catch (error) {
    console.error('Error in send-reply API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}