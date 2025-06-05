import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const results = [];

    // Upload missing hero2 image to storage bucket
    const hero2Path = join(process.cwd(), 'public', 'images', 'hvac-hero-bg.svg');
    const hero2Buffer = readFileSync(hero2Path);

    const { data: hero2Data, error: hero2Error } = await supabaseAdmin.storage
      .from('images')
      .upload('templates/moderntrust/hero2.svg', hero2Buffer, {
        contentType: 'image/svg+xml',
        upsert: true
      });

    if (hero2Error) {
      results.push({ file: 'hero2.svg', error: hero2Error.message });
    } else {
      results.push({ file: 'hero2.svg', success: true, path: hero2Data.path });
    }

    // Also upload hero1 and about if they don't exist
    const hero1Path = join(process.cwd(), 'public', 'images', 'hvac-hero-bg.jpg');
    const hero1Buffer = readFileSync(hero1Path);

    const { data: hero1Data, error: hero1Error } = await supabaseAdmin.storage
      .from('images')
      .upload('templates/moderntrust/hero.jpg', hero1Buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (hero1Error) {
      results.push({ file: 'hero.jpg', error: hero1Error.message });
    } else {
      results.push({ file: 'hero.jpg', success: true, path: hero1Data.path });
    }

    const aboutPath = join(process.cwd(), 'public', 'images', 'default-hero.jpg');
    const aboutBuffer = readFileSync(aboutPath);

    const { data: aboutData, error: aboutError } = await supabaseAdmin.storage
      .from('images')
      .upload('templates/moderntrust/about.jpg', aboutBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (aboutError) {
      results.push({ file: 'about.jpg', error: aboutError.message });
    } else {
      results.push({ file: 'about.jpg', success: true, path: aboutData.path });
    }

    return res.status(200).json({
      message: 'Storage setup completed',
      results,
      storageUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/templates/moderntrust/`
    });

  } catch (error) {
    console.error('Storage setup error:', error);
    return res.status(500).json({ 
      error: 'Failed to setup storage',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}