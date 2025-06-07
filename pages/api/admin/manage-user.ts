import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check if user is Nicholas (super admin only)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this');
      
      if (!decoded || decoded.email !== 'nicholas@atlasgrowth.ai') {
        return res.status(403).json({ error: 'Access denied. Super admin only.' });
      }
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (req.method === 'POST') {
      // Create new user
      const { email, owner_name, company_id } = req.body;

      if (!email || !company_id) {
        return res.status(400).json({ error: 'Email and company_id are required' });
      }

      const { data: newUser, error: createError } = await supabase
        .from('tk_contacts')
        .insert({
          owner_email: email,
          owner_name: owner_name || '',
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

      return res.status(201).json({ success: true, user: newUser });

    } else if (req.method === 'PUT') {
      // Update existing user
      const { id, email, owner_name, company_id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('tk_contacts')
        .update({
          owner_email: email,
          owner_name: owner_name || '',
          company_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return res.status(500).json({ error: 'Failed to update user' });
      }

      return res.status(200).json({ success: true, user: updatedUser });

    } else if (req.method === 'DELETE') {
      // Delete user
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const { error: deleteError } = await supabase
        .from('tk_contacts')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        return res.status(500).json({ error: 'Failed to delete user' });
      }

      return res.status(200).json({ success: true, message: 'User deleted successfully' });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Manage user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}