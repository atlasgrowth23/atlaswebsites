import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const storageBaseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images`;

    // Update frames table to use proper storage URLs
    const updates = [
      {
        slug: 'hero_img',
        template_key: 'moderntrust',
        default_url: `${storageBaseUrl}/templates/moderntrust/hero.jpg`
      },
      {
        slug: 'hero_img_2', 
        template_key: 'moderntrust',
        default_url: `${storageBaseUrl}/templates/moderntrust/hero2.svg`
      },
      {
        slug: 'about_img',
        template_key: 'moderntrust', 
        default_url: `${storageBaseUrl}/templates/moderntrust/about.jpg`
      }
    ];

    const results = [];

    for (const update of updates) {
      const { data, error } = await supabaseAdmin
        .from('frames')
        .upsert({
          slug: update.slug,
          template_key: update.template_key,
          default_url: update.default_url,
          updated_at: new Date().toISOString()
        });

      if (error) {
        results.push({ ...update, error: error.message });
      } else {
        results.push({ ...update, success: true });
      }
    }

    return res.status(200).json({
      message: 'Frame URLs updated to use storage',
      results,
      storageBaseUrl
    });

  } catch (error) {
    console.error('Frame URL update error:', error);
    return res.status(500).json({ 
      error: 'Failed to update frame URLs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}