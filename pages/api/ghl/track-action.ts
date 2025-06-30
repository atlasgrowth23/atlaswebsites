import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { company_slug, action_type, timestamp, ...actionData } = req.body;

    // TODO: Replace with your actual GHL API credentials and endpoint
    const GHL_API_KEY = process.env.GHL_API_KEY;
    const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;

    if (!GHL_API_KEY || !GHL_LOCATION_ID) {
      console.log('GHL API not configured yet - logging action locally:', {
        company_slug,
        action_type,
        timestamp,
        actionData
      });
      
      return res.status(200).json({ 
        success: true, 
        message: 'Action logged locally (GHL not configured yet)',
        data: { company_slug, action_type, timestamp, actionData }
      });
    }

    // When you set up your GHL pipeline, you'll use these endpoints:
    
    // 1. For contact creation/update:
    // POST https://rest.gohighlevel.com/v1/contacts/
    
    // 2. For pipeline stage updates:
    // PUT https://rest.gohighlevel.com/v1/pipelines/{pipelineId}/opportunities/{opportunityId}
    
    // 3. For activity/note logging:
    // POST https://rest.gohighlevel.com/v1/contacts/{contactId}/notes

    const trackingPayload = {
      contact: {
        // You'll need to identify the contact by phone or email
        phone: actionData.phone || 'unknown',
        firstName: company_slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        source: 'video_intro_page'
      },
      opportunity: {
        pipelineStageId: getStageIdByAction(action_type),
        monetaryValue: 2500, // Your average website deal value
        title: `Website Interest - ${company_slug}`,
        status: 'open'
      },
      activity: {
        type: action_type,
        description: `${action_type} on video intro page`,
        timestamp,
        metadata: actionData
      }
    };

    // Example GHL API call (uncomment when you have credentials):
    /*
    const response = await fetch(`https://rest.gohighlevel.com/v1/contacts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GHL_API_KEY}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28'
      },
      body: JSON.stringify(trackingPayload.contact)
    });

    const ghlResult = await response.json();
    */

    return res.status(200).json({
      success: true,
      message: 'Action tracked successfully',
      data: trackingPayload
    });

  } catch (error) {
    console.error('Error tracking action to GHL:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getStageIdByAction(actionType: string): string {
  // Map your actions to GHL pipeline stage IDs
  // You'll get these IDs when you create your GHL pipeline
  const stageMapping: Record<string, string> = {
    'video_clicked': 'stage_video_clicked',
    'button_clicked': 'stage_engaged',
    'website_viewed': 'stage_website_viewed', 
    'calendar_opened': 'stage_calendar_opened',
    'chat_opened': 'stage_chat_opened'
  };

  return stageMapping[actionType] || 'stage_new_lead';
}