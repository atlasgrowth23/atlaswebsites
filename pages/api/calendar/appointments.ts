import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
      return res.status(400).json({ error: 'Date parameter is required' });
    }

    // Get appointments for the specified date
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('appointment_date', date)
      .order('appointment_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return res.status(500).json({ error: 'Failed to fetch appointments' });
    }

    return res.status(200).json({ appointments: appointments || [] });

  } catch (error) {
    console.error('Appointments API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}