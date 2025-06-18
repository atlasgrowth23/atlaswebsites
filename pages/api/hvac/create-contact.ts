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
      firstName,
      lastName,
      email,
      phone,
      serviceType
    } = req.body;

    // Validate required fields
    if (!companyId || !visitorId || !firstName || !lastName) {
      return res.status(400).json({ error: 'Missing required fields: companyId, visitorId, firstName, lastName' });
    }

    // Ensure at least email or phone is provided
    if (!email && !phone) {
      return res.status(400).json({ error: 'Either email or phone is required' });
    }

    // Check for duplicate contacts by phone or email
    let duplicateContact = null;
    if (phone || email) {
      const { data: existingContacts, error: searchError } = await supabase
        .from('hvac_contacts')
        .select('id, first_name, last_name, phone, email')
        .eq('company_id', companyId)
        .or(`phone.eq.${phone || ''},email.eq.${email || ''}`);

      if (searchError) {
        console.error('Error searching for duplicates:', searchError);
        return res.status(500).json({ error: 'Failed to check for existing contacts' });
      }

      if (existingContacts && existingContacts.length > 0) {
        duplicateContact = existingContacts[0];
      }
    }

    let contactId;
    let isNewContact = true;

    if (duplicateContact) {
      // For now, create new contact anyway - future enhancement will ask user to confirm
      // This maintains the current flow while preparing for duplicate detection
      contactId = duplicateContact.id;
      isNewContact = false;

      // Update existing contact with any new information
      const { error: updateError } = await supabase
        .from('hvac_contacts')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone || duplicateContact.phone,
          email: email || duplicateContact.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', duplicateContact.id);

      if (updateError) {
        console.error('Error updating contact:', updateError);
        return res.status(500).json({ error: 'Failed to update contact' });
      }
    } else {
      // Create new contact
      const { data: newContact, error: createError } = await supabase
        .from('hvac_contacts')
        .insert({
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          email: email || null,
          status: 'new_lead',
          source: 'chat_widget'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating contact:', createError);
        return res.status(500).json({ error: 'Failed to create contact' });
      }

      contactId = newContact.id;
    }

    // Create contact_created activity
    const { error: activityError } = await supabase
      .from('hvac_contact_activities')
      .insert({
        contact_id: contactId,
        activity_type: 'contact_created',
        description: isNewContact ? 
          `New contact created via chat widget for ${serviceType} request` :
          `Contact updated via chat widget for ${serviceType} request`,
        metadata: {
          service_type: serviceType,
          source: 'chat_widget',
          visitor_id: visitorId
        }
      });

    if (activityError) {
      console.error('Error creating activity:', activityError);
      // Don't fail the request for this, just log it
    }

    // Update conversation to link the contact
    if (conversationId) {
      const { error: linkError } = await supabase
        .from('hvac_conversations')
        .update({ contact_id: contactId })
        .eq('id', conversationId);

      if (linkError) {
        console.error('Error linking contact to conversation:', linkError);
        // Don't fail the request for this, just log it
      }
    }

    // Get the final contact data for response
    const { data: finalContact, error: fetchError } = await supabase
      .from('hvac_contacts')
      .select('*')
      .eq('id', contactId)
      .single();

    if (fetchError) {
      console.error('Error fetching final contact:', fetchError);
      return res.status(500).json({ error: 'Contact created but failed to fetch details' });
    }

    res.status(isNewContact ? 201 : 200).json({
      success: true,
      contact: finalContact,
      isNewContact,
      duplicateDetected: !!duplicateContact,
      message: isNewContact ? 'Contact created successfully' : 'Contact updated successfully'
    });

  } catch (error) {
    console.error('Create HVAC contact error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}