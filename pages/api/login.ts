import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

type ResponseData = {
  success: boolean;
  message?: string;
  businessSlug?: string;
  username?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  const { username, password, businessSlug } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username and password are required' 
    });
  }

  try {
    let sql;
    let params;

    // We can login either with username/password directly
    // or with a specific business slug and password
    if (businessSlug) {
      // Check credentials based on business slug
      sql = `
        SELECT username, business_slug
        FROM user_credentials
        WHERE business_slug = $1 AND password = $2
      `;
      params = [businessSlug, password];
    } else {
      // Check credentials based on username
      sql = `
        SELECT username, business_slug
        FROM user_credentials
        WHERE username = $1 AND password = $2
      `;
      params = [username, password];
    }

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login timestamp
    await query(`
      UPDATE user_credentials
      SET last_login = NOW()
      WHERE username = $1
    `, [result.rows[0].username]);

    // Return success with the business slug
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      businessSlug: result.rows[0].business_slug,
      username: result.rows[0].username
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate: ' + error.message
    });
  }
}