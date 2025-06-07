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
    const { email, name, company_id } = req.body;

    // Validate required fields
    if (!email || !company_id) {
      return res.status(400).json({ error: 'Email and company_id are required' });
    }

    // Check if user already exists for this company
    const { data: existingUser } = await supabase
      .from('tk_contacts')
      .select('*')
      .eq('company_id', company_id)
      .single();

    if (existingUser) {
      // Update existing user's email, keep existing name if no new name provided
      const { data: updatedUser, error: updateError } = await supabase
        .from('tk_contacts')
        .update({
          owner_email: email, // Update to new email
          owner_name: name && name !== 'Business Owner' ? name : existingUser.owner_name, // Keep existing name unless we have a real name
          updated_at: new Date().toISOString()
        })
        .eq('company_id', company_id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return res.status(500).json({ error: 'Failed to update user' });
      }

      return res.status(200).json({
        success: true,
        user: updatedUser,
        message: 'User updated successfully'
      });
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('tk_contacts')
        .insert({
          owner_email: email,
          owner_name: name || 'Business Owner',
          company_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      return res.status(201).json({
        success: true,
        user: newUser,
        message: 'User created successfully'
      });
    }

  } catch (error) {
    console.error('Create user by company error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}