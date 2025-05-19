// pages/api/ai-chat-response.ts
import { NextApiRequest, NextApiResponse } from "next";
import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import { queryOne } from "@/lib/db";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { message, companySlug, contactId } = req.body;

    if (!message || !companySlug) {
      return res.status(400).json({ error: 'Message and company slug are required' });
    }

    // Get company ID from slug
    const company = await queryOne('SELECT id, name FROM companies WHERE slug = $1', [companySlug]);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Create system prompt with company info
    const systemPrompt = `You are a friendly and helpful virtual assistant for ${company.name}. 
    Your goal is to provide helpful information about HVAC services, answer basic questions, and assist potential customers.
    Be conversational but professional. Don't make up specific details about services or pricing.
    For detailed quotes or scheduling requests, encourage the user to provide their contact information so a representative can reach out to them.
    Always be helpful, friendly, and concise (keep responses under 3 sentences when possible).`;

    // Call Anthropic API with the prompt
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      system: systemPrompt,
      max_tokens: 300,
      messages: [
        { role: "user", content: message }
      ],
    });

    // Extract the text content from the response
    let aiReply = "";
    if (response.content && response.content.length > 0) {
      const content = response.content[0];
      if ('text' in content) {
        aiReply = content.text;
      }
    }

    if (!aiReply) {
      aiReply = "I'm sorry, I'm having trouble understanding your request. Could you please try rephrasing your question or reach out to our team directly?";
    }

    // Store the AI response in the database
    const messageId = uuidv4();
    const storedMessage = await queryOne(
      `INSERT INTO company_messages (id, company_id, contact_id, body, direction, service_type, ts) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       RETURNING *`,
      [messageId, company.id, contactId || null, aiReply, 'out', 'website_chat']
    );

    return res.status(200).json({ 
      reply: aiReply,
      messageId: messageId 
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}