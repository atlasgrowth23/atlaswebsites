import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { domain } = req.query;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ message: 'Domain parameter required' });
  }

  try {
    // Find company with this custom domain
    const result = await query(
      'SELECT id, name, slug, custom_domain FROM companies WHERE custom_domain = $1 LIMIT 1',
      [domain]
    );

    if (result.rows && result.rows.length > 0) {
      const company = result.rows[0];
      res.status(200).json(company);
    } else {
      res.status(404).json({ message: 'No company found for this domain' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}