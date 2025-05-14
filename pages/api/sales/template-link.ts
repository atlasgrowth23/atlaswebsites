import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  try {
    switch (method) {
      case 'GET':
        // Get template link for a company
        const { companyId, leadId } = req.query;
        
        if (!companyId && !leadId) {
          return res.status(400).json({ error: 'Company ID or Lead ID is required' });
        }
        
        let companyQuery = '';
        let params = [];
        
        if (leadId) {
          companyQuery = `
            SELECT c.id, c.name, sl.template_shared, sl.template_viewed
            FROM sales_leads sl
            JOIN companies c ON sl.company_id = c.id
            WHERE sl.id = $1
          `;
          params = [leadId];
        } else {
          companyQuery = `
            SELECT c.id, c.name, sl.template_shared, sl.template_viewed
            FROM companies c
            LEFT JOIN sales_leads sl ON c.id = sl.company_id
            WHERE c.id = $1
          `;
          params = [companyId];
        }
        
        const result = await query(companyQuery, params);
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Company not found' });
        }
        
        const company = result.rows[0];
        const slug = company.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const templateLink = `/t/moderntrust/${slug}`;
        
        return res.status(200).json({
          templateLink,
          company,
          fullUrl: `${process.env.NEXT_PUBLIC_BASE_URL || req.headers.host}${templateLink}`
        });
        
      case 'POST':
        // Mark template as shared or viewed
        const { id, status } = req.body;
        
        if (!id || !status) {
          return res.status(400).json({ error: 'Lead ID and status are required' });
        }
        
        if (status !== 'shared' && status !== 'viewed') {
          return res.status(400).json({ error: 'Status must be "shared" or "viewed"' });
        }
        
        // Check if lead exists
        const leadCheck = await query('SELECT id FROM sales_leads WHERE id = $1', [id]);
        
        if (leadCheck.rows.length === 0) {
          return res.status(404).json({ error: 'Lead not found' });
        }
        
        // Update the lead status
        const updateQuery = `
          UPDATE sales_leads 
          SET template_${status} = true${status === 'viewed' ? ', first_viewed_at = COALESCE(first_viewed_at, NOW()), last_viewed_at = NOW()' : ''}
          WHERE id = $1
          RETURNING *
        `;
        
        const updateResult = await query(updateQuery, [id]);
        
        // If marking as viewed, also update the stage to "Template Viewed" if applicable
        if (status === 'viewed') {
          // Get the "Template Viewed" stage
          const stageResult = await query(`
            SELECT id FROM pipeline_stages WHERE name = 'Template Viewed' LIMIT 1
          `);
          
          if (stageResult.rows.length > 0) {
            const templateViewedStageId = stageResult.rows[0].id;
            
            // Update the lead stage if it's currently in "Template Shared" or earlier
            await query(`
              UPDATE sales_leads 
              SET stage_id = $1 
              WHERE id = $2 AND (
                stage_id IN (
                  SELECT id FROM pipeline_stages WHERE order_num <= (
                    SELECT order_num FROM pipeline_stages WHERE name = 'Template Shared'
                  )
                )
              )
            `, [templateViewedStageId, id]);
          }
        }
        
        return res.status(200).json(updateResult.rows[0]);
        
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling template-link request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}