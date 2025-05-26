import { NextApiRequest, NextApiResponse } from 'next';

// This will use the Twilio credentials you'll provide
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // For now, let's just save the opt-in to database and prepare for Twilio
    const { query } = await import('@/lib/db');
    
    // Create opt-ins table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS sms_opt_ins (
        id SERIAL PRIMARY KEY,
        phone_number VARCHAR(20) NOT NULL UNIQUE,
        opted_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        source VARCHAR(50) DEFAULT 'atlas_growth_website'
      )
    `);

    // Insert the opt-in
    await query(`
      INSERT INTO sms_opt_ins (phone_number) 
      VALUES ($1) 
      ON CONFLICT (phone_number) 
      DO UPDATE SET opted_in_at = CURRENT_TIMESTAMP
    `, [phoneNumber]);

    // Here's where we'll add Twilio SMS sending once you provide the credentials
    // For now, we'll return success and prepare for Twilio integration
    
    console.log(`SMS opt-in recorded for ${phoneNumber}`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Successfully opted in for SMS updates!' 
    });

  } catch (error) {
    console.error('Error handling SMS opt-in:', error);
    res.status(500).json({ 
      error: 'Failed to process opt-in. Please try again.' 
    });
  }
}