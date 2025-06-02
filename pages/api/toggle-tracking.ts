import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { businessId, enabled } = req.body;

    if (!businessId) {
      return res.status(400).json({ error: 'Business ID is required' });
    }

    // Update the tracking_enabled field in the companies table
    const { data, error } = await supabaseAdmin
      .from('companies')
      .update({ tracking_enabled: enabled })
      .eq('id', businessId)
      .select()
      .single();

    if (error) {
      console.error('Error updating tracking status:', error);
      return res.status(500).json({ error: 'Failed to update tracking status' });
    }

    return res.status(200).json({ 
      success: true, 
      data,
      message: `Tracking ${enabled ? 'enabled' : 'disabled'} successfully`
    });

  } catch (error) {
    console.error('Error in toggle-tracking:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}