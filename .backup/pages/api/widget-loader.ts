import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow CORS for widget integration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company } = req.query;
    
    if (!company || typeof company !== 'string') {
      return res.status(400).json({ 
        error: 'Company slug is required' 
      });
    }

    // Track widget view for analytics
    const companyResult = await query(
      'SELECT id FROM companies WHERE slug = $1 LIMIT 1',
      [company]
    );

    if (companyResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Company not found' 
      });
    }

    const companyId = companyResult.rows[0].id;

    // Attempt to record widget view if table exists
    try {
      await query(
        `INSERT INTO widget_views (
          company_id, 
          viewed_at,
          referrer
        ) VALUES ($1, $2, $3)`,
        [
          companyId,
          new Date().toISOString(),
          req.headers.referer || null
        ]
      );
    } catch (viewError) {
      // If the table doesn't exist, log but continue - tracking is optional
      console.log('Widget view tracking failed - table may not exist yet');
    }

    // Return success response
    return res.status(200).json({ 
      success: true,
      message: 'Widget loaded successfully',
      company
    });
  } catch (error) {
    console.error('Error loading widget:', error);
    return res.status(500).json({ 
      error: 'Failed to load widget' 
    });
  }
}