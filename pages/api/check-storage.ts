import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Check the images storage bucket structure
    const { data: rootFiles, error: rootError } = await supabaseAdmin
      .storage
      .from('images')
      .list('', { limit: 100 });

    // Check templates folder
    const { data: templatesFiles, error: templatesError } = await supabaseAdmin
      .storage
      .from('images')
      .list('templates', { limit: 100 });

    // Check moderntrust folder specifically
    const { data: moderntrustFiles, error: moderntrustError } = await supabaseAdmin
      .storage
      .from('images')
      .list('templates/moderntrust', { limit: 100 });

    // Check what's in the frames table for moderntrust
    const { data: frames, error: framesError } = await supabaseAdmin
      .from('frames')
      .select('*')
      .eq('template_key', 'moderntrust');

    return res.status(200).json({
      storage: {
        root: rootFiles || [],
        rootError: rootError?.message || null,
        templates: templatesFiles || [],
        templatesError: templatesError?.message || null,
        moderntrust: moderntrustFiles || [],
        moderntrustError: moderntrustError?.message || null
      },
      database: {
        frames: frames || [],
        framesError: framesError?.message || null
      },
      analysis: {
        storageBaseUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images`,
        expectedPaths: [
          '/templates/moderntrust/hero.jpg',
          '/templates/moderntrust/about.jpg'
        ]
      }
    });

  } catch (error) {
    console.error('Storage check error:', error);
    return res.status(500).json({ 
      error: 'Failed to check storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}