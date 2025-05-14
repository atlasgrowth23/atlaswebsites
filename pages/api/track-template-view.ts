import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${method} Not Allowed`);
  }

  try {
    const { companyName, template } = req.body;
    
    if (!companyName || !template) {
      return res.status(400).json({ error: 'Company name and template are required' });
    }
    
    // Find the company by name (case insensitive)
    const companyResult = await query(
      'SELECT id FROM companies WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [companyName]
    );
    
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const companyId = companyResult.rows[0].id;
    
    // Check if a lead exists for this company
    const leadResult = await query(
      'SELECT id, template_shared, template_viewed FROM sales_leads WHERE company_id = $1 LIMIT 1',
      [companyId]
    );
    
    if (leadResult.rows.length === 0) {
      // If no lead exists, we should create one
      // Get the first stage ID
      const stageResult = await query(
        'SELECT id FROM pipeline_stages WHERE name = $1 LIMIT 1',
        ['Template Viewed']
      );
      
      const stageId = stageResult.rows.length > 0 ? stageResult.rows[0].id : null;
      
      // Create a new lead
      const newLeadResult = await query(
        `INSERT INTO sales_leads 
         (company_id, stage_id, template_shared, template_viewed, first_viewed_at, last_viewed_at) 
         VALUES ($1, $2, $3, $4, NOW(), NOW()) 
         RETURNING id`,
        [companyId, stageId, true, true]
      );
      
      return res.status(200).json({
        success: true,
        message: 'Template view tracked for new lead',
        leadId: newLeadResult.rows[0].id
      });
    } else {
      // Update the existing lead
      const lead = leadResult.rows[0];
      
      // If the template was never marked as shared, mark it now
      if (!lead.template_shared) {
        await query(
          'UPDATE sales_leads SET template_shared = true WHERE id = $1',
          [lead.id]
        );
      }
      
      // Now mark as viewed
      const updateResult = await query(
        `UPDATE sales_leads 
         SET template_viewed = true, 
             first_viewed_at = COALESCE(first_viewed_at, NOW()), 
             last_viewed_at = NOW() 
         WHERE id = $1 
         RETURNING *`,
        [lead.id]
      );
      
      // If not already in Template Viewed stage or later, update the stage
      // Get the "Template Viewed" stage
      const stageResult = await query(
        'SELECT id, order_num FROM pipeline_stages WHERE name = $1 LIMIT 1',
        ['Template Viewed']
      );
      
      if (stageResult.rows.length > 0) {
        const templateViewedStage = stageResult.rows[0];
        
        // Get the current stage order
        const currentStageResult = await query(
          `SELECT ps.order_num 
           FROM sales_leads sl
           JOIN pipeline_stages ps ON sl.stage_id = ps.id
           WHERE sl.id = $1`,
          [lead.id]
        );
        
        if (currentStageResult.rows.length > 0) {
          const currentOrderNum = currentStageResult.rows[0].order_num;
          
          // Only update if current stage is before Template Viewed
          if (currentOrderNum < templateViewedStage.order_num) {
            await query(
              'UPDATE sales_leads SET stage_id = $1 WHERE id = $2',
              [templateViewedStage.id, lead.id]
            );
          }
        }
      }
      
      // Also log this as an activity
      await query(
        `INSERT INTO sales_activities 
         (lead_id, activity_type, description) 
         VALUES ($1, $2, $3)`,
        [lead.id, 'template', 'Template viewed by prospect']
      );
      
      return res.status(200).json({
        success: true,
        message: 'Template view tracked for existing lead',
        leadId: lead.id
      });
    }
  } catch (error) {
    console.error('Error tracking template view:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}