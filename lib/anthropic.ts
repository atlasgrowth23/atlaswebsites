import Anthropic from '@anthropic-ai/sdk';

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
Be helpful, friendly, and professional when responding to customer inquiries.
Provide accurate information about HVAC services.
When you don't know specific information about ${companyInfo.name} (like specific pricing or scheduling), 
recommend the customer provide their contact information so an HVAC professional can get back to them.

Company information:
Name: ${companyInfo.name}
City: ${companyInfo.city || 'N/A'}
State: ${companyInfo.state || 'N/A'}
${companyInfo.working_hours ? `Hours: ${companyInfo.working_hours}` : ''}
${companyInfo.phone ? `Phone: ${companyInfo.phone}` : ''}
    `;

    const message = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        { role: 'user', content: customerMessage }
      ],
    });

    return message.content[0].text;
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

    return response.content[0].text.trim();
  } catch (error) {
    console.error('Error categorizing customer message:', error);
    return "general_inquiry";
  }
}