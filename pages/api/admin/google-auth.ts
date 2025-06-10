import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, access_token, refresh_token, expires_at } = req.body;

    if (!user_id || !access_token || !refresh_token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Store tokens in admin_user_tokens table
    const { data, error } = await supabaseAdmin
      .from('admin_user_tokens')
      .upsert({
        user_id,
        provider: 'google',
        access_token,
        refresh_token,
        expires_at: expires_at ? new Date(expires_at * 1000).toISOString() : null,
      }, {
        onConflict: 'user_id,provider'
      });

    if (error) {
      console.error('Error storing tokens:', error);
      return res.status(500).json({ error: 'Failed to store tokens' });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Google auth API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}