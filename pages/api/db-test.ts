import type { NextApiRequest, NextApiResponse } from 'next';
import { query, queryMany } from '../../lib/db';

type ResponseData = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  try {
    console.log('Testing database connection...');
    
    // Basic connection test
    const dbInfo = await query('SELECT current_database() as db_name, version()');
    console.log('Database connection successful!');
    console.log('Database:', dbInfo.rows[0].db_name);
    console.log('Version:', dbInfo.rows[0].version);
    
    // Test companies table query
    const companies = await queryMany('SELECT id, name, slug FROM companies LIMIT 5');
    console.log(`Found ${companies.length} companies`);
    
    return res.status(200).json({
      success: true,
      message: 'Database connection is working!',
      data: {
        dbInfo: dbInfo.rows[0],
        companies
      }
    });
    
  } catch (error: any) {
    console.error('Database test failed:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
}