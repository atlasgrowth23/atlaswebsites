import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug, template, getCompany } = req.query;

  if (req.method === 'GET') {
    try {
      // Get company data from slug
      const companyResult = await query(
        'SELECT id, name, slug, city, state FROM companies WHERE slug = $1 LIMIT 1',
        [slug]
      );

      if (companyResult.rows.length === 0) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const company = companyResult.rows[0];

      // If requesting company data only
      if (getCompany === 'true') {
        return res.status(200).json(company);
      }

      // Get existing company frames (the real data templates use)
      const frames = await query(`
        SELECT slug as frame_key, url as image_url 
        FROM company_frames 
        WHERE company_id = $1
      `, [company.id]);

      // Convert to the format expected by the editor
      const customizations = frames.rows.map((frame: any) => ({
        customization_type: frame.frame_key,
        custom_value: frame.image_url
      }));

      res.status(200).json(customizations);
    } catch (error) {
      console.error('Error fetching customizations:', error);
      res.status(500).json({ error: 'Failed to fetch customizations' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { companyId, templateKey, customizations } = req.body;

      // Save to company_frames table that templates actually use
      for (const [frameKey, imageUrl] of Object.entries(customizations)) {
        if (imageUrl && imageUrl.toString().trim()) {
          // Insert or update company frame
          await query(`
            INSERT INTO company_frames (company_id, slug, url, created_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (company_id, slug)
            DO UPDATE SET 
              url = EXCLUDED.url,
              created_at = CURRENT_TIMESTAMP
          `, [companyId, frameKey, imageUrl]);
          
          console.log(`Saved company frame: ${frameKey} = ${imageUrl}`);
        } else {
          // Remove frame if value is empty
          await query(`
            DELETE FROM company_frames 
            WHERE company_id = $1 AND slug = $2
          `, [companyId, frameKey]);
          
          console.log(`Removed company frame: ${frameKey}`);
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving customizations:', error);
      res.status(500).json({ error: 'Failed to save customizations' });
    }
  }
  
  else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}