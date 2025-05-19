// pages/api/chat-ai.ts
import { NextApiRequest, NextApiResponse } from "next";
import Anthropic from '@anthropic-ai/sdk';

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
    const { userMessage, companyName } = req.body;

    if (!userMessage) {
      return res.status(400).json({ error: 'User message is required' });
    }

    // Create system prompt with company info
    const systemPrompt = `You are a friendly and helpful virtual assistant for ${companyName || 'this HVAC company'}. 
    Your goal is to provide helpful information about HVAC services, answer basic questions, and assist potential customers.
    Be conversational but professional. Don't make up specific details about services or pricing.
    For detailed quotes or scheduling requests, encourage the user to provide their contact information so a representative can reach out to them.`;

    // Call Anthropic API with simpler structure
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
      system: systemPrompt,
      max_tokens: 1000,
      messages: [
        { role: "user", content: userMessage }
      ],
    });

    // Extract the text content from the response
    let replyText = "";
    if (response.content && response.content.length > 0) {
      const content = response.content[0];
      // Check if the content block is a text block
      if ('text' in content) {
        replyText = content.text;
      }
    }

    return res.status(200).json({ 
      reply: replyText || "I'm sorry, I couldn't generate a response." 
    });
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return res.status(500).json({ error: 'Failed to generate response' });
  }
}