import Anthropic from '@anthropic-ai/sdk';
import { MessageParam } from '@anthropic-ai/sdk/resources';

// The newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate a response to a customer message using Claude
 * @param customerMessage The message from the customer
 * @param companyInfo Company information to personalize the response
 * @returns Promise with Claude's response
 */
export async function generateHVACResponse(customerMessage: string, companyInfo: any): Promise<string> {
  try {
    const systemPrompt = `
You are an assistant for ${companyInfo.name}, an HVAC company. 
Keep responses under 2 sentences - be extremely concise and direct.
Be helpful and professional in very few words.
For pricing, scheduling, or equipment-specific questions, just say we need their contact info to provide an accurate answer.

Company information:
Name: ${companyInfo.name}
City: ${companyInfo.city || 'N/A'}
State: ${companyInfo.state || 'N/A'}
${companyInfo.working_hours ? `Hours: ${companyInfo.working_hours}` : ''}
${companyInfo.phone ? `Phone: ${companyInfo.phone}` : ''}

IMPORTANT: Responses must be under 100 words maximum. Keep it extremely brief.
    `;

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 150,
      system: systemPrompt,
      messages: [
        { role: 'user', content: customerMessage }
      ],
    });

    // Get the text from content blocks
    const textContent = message.content
      .filter(block => block.type === 'text')
      .map(block => (block.type === 'text' ? block.text : ''))
      .join(' ');
    
    if (textContent) {
      return textContent;
    }
    
    // Fallback response
    return "I'm here to help with your HVAC needs. Please let me know how I can assist you today.";
  } catch (error) {
    console.error('Error generating HVAC response:', error);
    return "I'm sorry, I'm having trouble connecting to our assistant right now. Please leave your contact information and our team will get back to you as soon as possible.";
  }
}

/**
 * Categorize a customer message to determine its intent
 * @param message The customer message
 * @returns Promise with the message category/intent
 */
export async function categorizeCustomerMessage(message: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 50,
      system: `
Classify the customer message into exactly one of these categories:
- "service_request" - Customer wants to schedule a service or maintenance
- "quote_request" - Customer wants pricing information
- "troubleshooting" - Customer has an HVAC issue and needs help
- "general_inquiry" - Any other general questions
Return only the category name, nothing else.
      `,
      messages: [
        { role: 'user', content: message }
      ],
    });

    // Get the text from content blocks
    const textContent = response.content
      .filter(block => block.type === 'text')
      .map(block => (block.type === 'text' ? block.text : ''))
      .join(' ')
      .trim();
    
    if (textContent) {
      return textContent;
    }
    
    // Default category if unable to classify
    return "general_inquiry";
  } catch (error) {
    console.error('Error categorizing customer message:', error);
    return "general_inquiry";
  }
}