import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      message,
      companyId,
      visitorId,
      conversationId,
      contactId,
      serviceType,
      isFromVisitor = true
    } = req.body;

    // Validate required fields
    if (!message || !companyId || !visitorId) {
      return res.status(400).json({ error: 'Missing required fields: message, companyId, visitorId' });
    }

    let currentConversationId = conversationId;

    // Create conversation if it doesn't exist
    if (!currentConversationId) {
      const { data: newConversation, error: conversationError } = await supabase
        .from('hvac_conversations')
        .insert({
          company_id: companyId,
          visitor_id: visitorId,
          contact_id: contactId || null,
          service_type: serviceType || null,
          status: 'active'
        })
        .select()
        .single();

      if (conversationError) {
        console.error('Error creating conversation:', conversationError);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      currentConversationId = newConversation.id;
    }

    // Save the message
    const { data: savedMessage, error: messageError } = await supabase
      .from('hvac_messages')
      .insert({
        conversation_id: currentConversationId,
        company_id: companyId,
        contact_id: contactId || null,
        visitor_id: visitorId,
        message: message.trim(),
        is_from_visitor: isFromVisitor,
        message_type: 'text'
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error saving message:', messageError);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    // Create activity if there's a contact and this is from visitor
    if (contactId && isFromVisitor) {
      const { error: activityError } = await supabase
        .from('hvac_contact_activities')
        .insert({
          contact_id: contactId,
          activity_type: 'chat_message_sent',
          description: `Sent message: "${message.trim().substring(0, 50)}${message.length > 50 ? '...' : ''}"`,
          metadata: {
            conversation_id: currentConversationId,
            message_length: message.length,
            service_type: serviceType
          }
        });

      if (activityError) {
        console.error('Error creating message activity:', activityError);
        // Don't fail the request for this, just log it
      }
    }

    // If this is a service request (user clicked a service button), create activity
    if (serviceType && isFromVisitor && message === serviceType) {
      const { error: serviceActivityError } = await supabase
        .from('hvac_contact_activities')
        .insert({
          contact_id: contactId || null,
          activity_type: 'chat_service_request',
          description: `Requested ${serviceType} service via chat widget`,
          metadata: {
            conversation_id: currentConversationId,
            service_type: serviceType,
            visitor_id: visitorId
          }
        });

      if (serviceActivityError) {
        console.error('Error creating service request activity:', serviceActivityError);
        // Don't fail the request for this, just log it
      }
    }

    res.status(201).json({
      success: true,
      message: savedMessage,
      conversationId: currentConversationId
    });

  } catch (error) {
    console.error('Send HVAC message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}