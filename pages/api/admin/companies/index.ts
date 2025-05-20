import { NextApiRequest, NextApiResponse } from 'next';
import { queryMany } from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get all companies with pipeline information
    const companies = await queryMany(`
      SELECT 
        id, name, slug, city, state, phone, site, 
        rating, reviews, pipeline_stage, last_contact_date, notes
      FROM companies 
      ORDER BY 
        CASE 
          WHEN pipeline_stage = 'closed' THEN 6
          WHEN pipeline_stage = 'negotiation' THEN 5
          WHEN pipeline_stage = 'proposal' THEN 4
          WHEN pipeline_stage = 'meeting' THEN 3
          WHEN pipeline_stage = 'contacted' THEN 2
          ELSE 1
        END DESC,
        last_contact_date DESC NULLS LAST,
        name ASC
    `);
    
    // Default pipeline_stage to 'prospect' if it's null
    const processedCompanies = companies.map(company => ({
      ...company,
      pipeline_stage: company.pipeline_stage || 'prospect',
      last_contact_date: company.last_contact_date ? company.last_contact_date.toString() : null
    }));
    
    return res.status(200).json(processedCompanies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}