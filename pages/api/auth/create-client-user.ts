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
    const { email, name, provider, provider_id, avatar_url } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!provider_id) {
      return res.status(400).json({ error: 'Provider ID is required' });
    }

    // Use the database function to get or create client user
    const { data: clientUser, error } = await supabase
      .rpc('get_or_create_client_user', {
        user_email: email,
        user_name: name || null,
        user_provider: provider || 'google',
        user_provider_id: provider_id,
        user_avatar_url: avatar_url || null
      });

    if (error) {
      console.error('Error creating/getting client user:', error);
      
      // Check if it's a "no company found" error
      if (error.message?.includes('No company found with email')) {
        return res.status(404).json({ 
          error: 'No business account found', 
          message: "This email isn't linked to a business account. Contact support at support@atlasgrowth.ai or sign up."
        });
      }
      
      return res.status(500).json({ error: 'Failed to create user account' });
    }

    res.status(200).json({
      success: true,
      user: clientUser,
      message: 'User account ready'
    });

  } catch (error) {
    console.error('Create client user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}