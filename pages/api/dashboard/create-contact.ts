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
    const { name, email, phone, company, notes, companyId } = req.body;

    if (!name || !companyId) {
      return res.status(400).json({ error: 'Name and company ID are required' });
    }

    // Create contact record
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('tk_contacts')
      .insert([
        {
          name: name.trim(),
          email: email?.trim() || null,
          phone: phone?.trim() || null,
          company_id: companyId,
          notes: notes?.trim() || null,
          source: 'manual_entry',
          last_interaction: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (contactError) {
      console.error('Error creating contact:', contactError);
      return res.status(500).json({ error: 'Failed to create contact' });
    }

    // Create a conversation record for this contact if they have an email or phone
    if (email || phone) {
      const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await supabaseAdmin
        .from('tk_conversations')
        .insert([
          {
            id: conversationId,
            contact_id: contact.id,
            company_id: companyId,
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          }
        ]);

      // Create initial system message
      await supabaseAdmin
        .from('tk_messages')
        .insert([
          {
            conversation_id: conversationId,
            contact_id: contact.id,
            company_id: companyId,
            message: `Contact manually added to system. ${notes ? `Notes: ${notes}` : ''}`,
            is_from_visitor: false,
            message_type: 'system',
            created_at: new Date().toISOString()
          }
        ]);
    }

    res.status(200).json({ 
      success: true, 
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company_name: company || 'Manual Entry',
        created_at: contact.created_at
      }
    });

  } catch (error) {
    console.error('Error in create-contact API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}