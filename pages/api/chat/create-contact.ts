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
      companyId,
      visitorId,
      conversationId,
      name,
      email,
      phone
    } = req.body;

    // Validate required fields
    if (!companyId || !visitorId || !name) {
      return res.status(400).json({ error: 'Missing required fields: companyId, visitorId, name' });
    }

    // Ensure at least email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({ error: 'Either email or phone is required' });
    }

    // Check if contact already exists for this visitor
    const { data: existingContact, error: checkError } = await supabase
      .from('contacts')
      .select('id')
      .eq('company_id', companyId)
      .eq('visitor_id', visitorId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing contact:', checkError);
      return res.status(500).json({ error: 'Failed to check existing contact' });
    }

    // If contact already exists, update it
    if (existingContact) {
      const { data: updatedContact, error: updateError } = await supabase
        .from('contacts')
        .update({
          name,
          email: email || null,
          phone: phone || null,
          last_interaction: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingContact.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating contact:', updateError);
        return res.status(500).json({ error: 'Failed to update contact' });
      }

      // Update conversation to link the contact
      if (conversationId) {
        await supabase
          .from('conversations')
          .update({ contact_id: existingContact.id })
          .eq('id', conversationId);
      }

      return res.status(200).json({
        success: true,
        contact: updatedContact,
        message: 'Contact updated successfully'
      });
    }

    // Create new contact
    const { data: newContact, error: createError } = await supabase
      .from('contacts')
      .insert({
        company_id: companyId,
        visitor_id: visitorId,
        name,
        email: email || null,
        phone: phone || null,
        scheduling_software: null
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating contact:', createError);
      return res.status(500).json({ error: 'Failed to create contact' });
    }

    // Update conversation to link the new contact
    if (conversationId) {
      const { error: linkError } = await supabase
        .from('conversations')
        .update({ contact_id: newContact.id })
        .eq('id', conversationId);

      if (linkError) {
        console.error('Error linking contact to conversation:', linkError);
        // Don't fail the request for this, just log it
      }
    }

    res.status(201).json({
      success: true,
      contact: newContact,
      message: 'Contact created successfully'
    });

  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}