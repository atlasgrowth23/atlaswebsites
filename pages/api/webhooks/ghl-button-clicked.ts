import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company_slug, contact_id, button_type, button_text, timestamp } = req.body;

    console.log('🔘 Button clicked webhook:', { company_slug, contact_id, button_type, button_text, timestamp });

    // Return data that GHL can use to update pipeline stage and custom fields
    return res.status(200).json({
      success: true,
      contact_id: contact_id,
      stage_update: 'action_taken',
      custom_fields: {
        buttons_clicked: button_type, // This will append to existing buttons clicked
        last_activity: `button_clicked_${button_type}`,
        last_activity_time: timestamp || new Date().toISOString()
      },
      trigger_data: {
        event_type: 'button_clicked',
        button_type: button_type,
        button_text: button_text,
        company_slug: company_slug,
        timestamp: timestamp || new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error processing button clicked webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}