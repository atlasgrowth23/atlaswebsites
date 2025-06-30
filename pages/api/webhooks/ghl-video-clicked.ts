import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company_slug, contact_id, timestamp } = req.body;

    console.log('🎥 Video clicked webhook:', { company_slug, contact_id, timestamp });

    // Return data that GHL can use to update pipeline stage
    return res.status(200).json({
      success: true,
      contact_id: contact_id,
      stage_update: 'video_watched',
      custom_fields: {
        last_activity: 'video_clicked',
        last_activity_time: timestamp || new Date().toISOString()
      },
      trigger_data: {
        event_type: 'video_clicked',
        company_slug: company_slug,
        timestamp: timestamp || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing video clicked webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}