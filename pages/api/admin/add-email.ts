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
    const { company_id, owner_name, owner_email } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    if (!owner_email) {
      return res.status(400).json({ error: 'Owner email is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(owner_email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if record already exists in tk_contacts
    const { data: existingContact, error: checkError } = await supabase
      .from('tk_contacts')
      .select('*')
      .eq('company_id', company_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing contact:', checkError);
      return res.status(500).json({ error: 'Failed to check existing contact' });
    }

    if (existingContact) {
      // Update existing record
      const { data, error } = await supabase
        .from('tk_contacts')
        .update({
          owner_name: owner_name || existingContact.owner_name,
          owner_email: owner_email,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', company_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating tk_contacts:', error);
        return res.status(500).json({ error: 'Failed to update contact' });
      }

      return res.status(200).json({
        success: true,
        message: 'Contact updated successfully',
        contact: data
      });
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('tk_contacts')
        .insert({
          company_id: company_id,
          owner_name: owner_name || null,
          owner_email: owner_email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating tk_contacts:', error);
        return res.status(500).json({ error: 'Failed to create contact' });
      }

      return res.status(201).json({
        success: true,
        message: 'Contact created successfully',
        contact: data
      });
    }

  } catch (error) {
    console.error('Add email API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}