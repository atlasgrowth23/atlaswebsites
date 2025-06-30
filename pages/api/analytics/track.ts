import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple analytics tracking endpoint to prevent 404 errors
    const { event, data } = req.body;
    
    console.log('Analytics event tracked:', { event, data, timestamp: new Date().toISOString() });
    
    // You can extend this to save to database or send to analytics service
    
    return res.status(200).json({ 
      success: true, 
      message: 'Event tracked successfully',
      event,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error tracking analytics:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}