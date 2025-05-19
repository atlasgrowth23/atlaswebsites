// pages/api/track-view.ts
import { NextApiRequest, NextApiResponse } from "next";
import { query } from "../../lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing company slug' });
  }

  try {
    // Check if portal_views table exists
    const tableExists = await query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'portal_views')"
    );
    
    if (!tableExists.rows[0]?.exists) {
      // Create table if it doesn't exist
      await query(`
        CREATE TABLE IF NOT EXISTS portal_views (
          id SERIAL PRIMARY KEY,
          company_slug VARCHAR(255) NOT NULL,
          viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT,
          ip_address VARCHAR(45)
        )
      `);
    }
    
    // Record the view
    await query(
      'INSERT INTO portal_views (company_slug, user_agent, ip_address) VALUES ($1, $2, $3)',
      [
        slug, 
        req.headers["user-agent"] || "Unknown", 
        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown"
      ]
    );
    
    console.log(`Tracked portal view for ${slug}`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error tracking portal view:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
}