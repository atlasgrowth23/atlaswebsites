import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check frames table
    const { data: frames, error: framesError } = await supabaseAdmin
      .from('frames')
      .select('*')
      .eq('template_key', 'moderntrust');

    // Check company_frames for a sample company
    const { data: companyFrames, error: companyFramesError } = await supabaseAdmin
      .from('company_frames')
      .select('*')
      .limit(5);

    // Check storage bucket structure
    const { data: storageList, error: storageError } = await supabaseAdmin
      .storage
      .from('images')
      .list('templates/moderntrust', {
        limit: 100
      });

    return res.status(200).json({
      frames: frames || [],
      framesError: framesError?.message || null,
      companyFrames: companyFrames || [],
      companyFramesError: companyFramesError?.message || null,
      storageFiles: storageList || [],
      storageError: storageError?.message || null
    });

  } catch (error) {
    console.error('Check frames error:', error);
    return res.status(500).json({ 
      error: 'Failed to check frames',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}