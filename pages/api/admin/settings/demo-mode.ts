import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get current user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (req.method === 'GET') {
      // Get current demo mode setting
      const { data: setting, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'demo_mode')
        .single();

      if (error) {
        return res.status(500).json({ error: 'Failed to get demo mode setting' });
      }

      res.status(200).json({ demoMode: setting?.value || false });

    } else if (req.method === 'POST') {
      const { demoMode } = req.body;

      if (typeof demoMode !== 'boolean') {
        return res.status(400).json({ error: 'demoMode must be a boolean' });
      }

      // Update demo mode setting
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          key: 'demo_mode',
          value: demoMode
        });

      if (error) {
        return res.status(500).json({ error: 'Failed to update demo mode setting' });
      }

      res.status(200).json({ demoMode });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Demo mode settings API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}