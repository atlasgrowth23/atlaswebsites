import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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
      companyName,
      companyHours,
      companyLocation,
      isFirstMessage
    } = req.body;

    if (!message || !companyId || !visitorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let currentConversationId = conversationId;

    // Create conversation if this is the first message
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          company_id: companyId,
          visitor_id: visitorId,
          status: 'active'
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        return res.status(500).json({ error: 'Failed to create conversation' });
      }

      currentConversationId = newConversation.id;
    }

    // Save user message to database
    const { error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        company_id: companyId,
        visitor_id: visitorId,
        message: message,
        is_from_visitor: true,
        message_type: 'text'
      });

    if (msgError) {
      console.error('Error saving message:', msgError);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    // Generate AI response using Anthropic API
    const aiResponse = await generateAIResponse(message, {
      companyName,
      companyHours,
      companyLocation,
      isFirstMessage
    });

    // Save AI response to database
    const { error: aiMsgError } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: currentConversationId,
        company_id: companyId,
        visitor_id: visitorId,
        message: aiResponse,
        is_from_visitor: false,
        message_type: 'text'
      });

    if (aiMsgError) {
      console.error('Error saving AI response:', aiMsgError);
    }

    res.status(200).json({
      response: aiResponse,
      conversationId: currentConversationId
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function generateAIResponse(
  userMessage: string,
  context: {
    companyName: string;
    companyHours?: any;
    companyLocation?: { latitude?: number; longitude?: number };
    isFirstMessage: boolean;
  }
): Promise<string> {
  try {
    // Prepare context for Claude
    let contextInfo = `You are a helpful customer service representative for ${context.companyName}, an HVAC (heating, ventilation, and air conditioning) company.`;
    
    if (context.companyHours) {
      const hours = typeof context.companyHours === 'string' 
        ? context.companyHours 
        : JSON.stringify(context.companyHours);
      contextInfo += ` Our business hours are: ${hours}.`;
    }

    if (context.companyLocation) {
      contextInfo += ` We are located at coordinates ${context.companyLocation.latitude}, ${context.companyLocation.longitude}.`;
    }

    contextInfo += `\n\nRespond helpfully to HVAC-related questions about heating, cooling, air conditioning, furnaces, heat pumps, ductwork, maintenance, repairs, installations, and emergency services. Keep responses concise (2-3 sentences), friendly, and professional. If asked about pricing, suggest they call for a quote. If it's an emergency, encourage them to call immediately.`;

    // Call Anthropic API
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY is not set');
      return `I'm here to help with your HVAC needs! Please call us at ${context.companyName} for immediate assistance with heating, cooling, or air conditioning questions.`;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Fast, cost-effective model for chat
        max_tokens: 200,
        system: contextInfo,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', response.status, errorData);
      return `I'm here to help with your HVAC needs! Please call us at ${context.companyName} for immediate assistance with heating, cooling, or air conditioning questions.`;
    }

    const data = await response.json();
    
    // Extract the response text
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    } else {
      console.error('Unexpected Anthropic response format:', data);
      return `Thanks for your message! I'm here to help with your HVAC needs. How can we assist you with heating, cooling, or air conditioning today?`;
    }

  } catch (error) {
    console.error('Error generating AI response:', error);
    return `Thanks for contacting ${context.companyName}! We're here to help with all your heating and cooling needs. Please let us know how we can assist you!`;
  }
}