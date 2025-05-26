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

      // Get customizations for this company and template
      const customizations = await query(`
        SELECT customization_type, custom_value, original_value 
        FROM business_customizations 
        WHERE company_id = $1 AND template_key = $2
      `, [company.id, template]);

      res.status(200).json(customizations.rows);
    } catch (error) {
      console.error('Error fetching customizations:', error);
      res.status(500).json({ error: 'Failed to fetch customizations' });
    }
  } 
  
  else if (req.method === 'POST') {
    try {
      const { companyId, templateKey, customizations } = req.body;

      // Save each customization
      for (const [type, value] of Object.entries(customizations)) {
        if (value && value.toString().trim()) {
          await query(`
            INSERT INTO business_customizations 
            (company_id, template_key, customization_type, custom_value, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (company_id, template_key, customization_type)
            DO UPDATE SET 
              custom_value = EXCLUDED.custom_value,
              updated_at = CURRENT_TIMESTAMP
          `, [companyId, templateKey, type, value]);
        } else {
          // Remove customization if value is empty
          await query(`
            DELETE FROM business_customizations 
            WHERE company_id = $1 AND template_key = $2 AND customization_type = $3
          `, [companyId, templateKey, type]);
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