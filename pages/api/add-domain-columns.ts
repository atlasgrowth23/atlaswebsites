import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test if custom_domain column exists by trying to select it
    const { error: testError } = await supabase
      .from('companies')
      .select('custom_domain')
      .limit(1);

    if (testError && testError.message.includes('custom_domain')) {
      // Column doesn't exist, so we need to add it manually
      // For now, let's just return instructions
      return res.status(200).json({
        success: false,
        message: 'Please run this SQL in your Supabase SQL editor:',
        sql: `
          ALTER TABLE companies 
          ADD COLUMN custom_domain TEXT UNIQUE,
          ADD COLUMN domain_verified BOOLEAN DEFAULT FALSE,
          ADD COLUMN domain_configured_at TIMESTAMPTZ;
          
          CREATE INDEX idx_companies_custom_domain ON companies(custom_domain) WHERE custom_domain IS NOT NULL;
        `
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Domain columns already exist'
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Failed to check/add columns' });
  }
}