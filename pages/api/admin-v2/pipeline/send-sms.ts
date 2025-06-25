import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lead_id, message_text, sent_by } = req.body;

  if (!lead_id || !message_text || !sent_by) {
    return res.status(400).json({ error: 'Missing required fields: lead_id, message_text, sent_by' });
  }

  const client = await pool.connect();
  
  try {
    // Get lead details
    const leadQuery = `
      SELECT l.*, ps.name as current_stage_name, c.name as campaign_name
      FROM leads l
      JOIN pipeline_stages ps ON l.current_stage_id = ps.id
      JOIN campaigns c ON l.campaign_id = c.id
      WHERE l.id = $1
    `;
    
    const leadResult = await client.query(leadQuery, [lead_id]);
    
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    
    const lead = leadResult.rows[0];
    
    // Verify lead is in "New Lead" stage
    if (lead.current_stage_name !== 'New Lead') {
      return res.status(400).json({ 
        error: `Lead is in ${lead.current_stage_name} stage. SMS can only be sent from New Lead stage.` 
      });
    }

    // Generate landing page URL with tracking
    const trackingId = `${lead_id}_${Date.now()}`;
    // Always use your Replit URL for now
    const baseUrl = 'https://ecff9f9a-4730-4865-9bc1-4171f6a31017-00-27datk18aao4y.picard.replit.dev';
    
    const { createBusinessSlug } = require('@/lib/slug-utils');
    const businessSlug = createBusinessSlug(lead.business_name);
    const landingPageUrl = `${baseUrl}/pipeline-v2/${businessSlug}?ref=${trackingId}`;
    
    // ALWAYS add the landing page URL to the message
    const finalMessage = `${message_text.trim()} ${landingPageUrl}`;
    
    console.log('🔗 SMS Message:', finalMessage);
    console.log('🔗 Landing Page URL:', landingPageUrl);

    // Send SMS via TextGrid
    const auth = Buffer.from(`${process.env.TEXTGRID_ACCOUNT_SID}:${process.env.TEXTGRID_AUTH_TOKEN}`).toString('base64');
    
    const formData = new URLSearchParams();
    formData.append('To', lead.phone);
    formData.append('From', process.env.TEXTGRID_FROM_NUMBER);
    formData.append('Body', finalMessage);

    const textGridResponse = await fetch(`https://api.textgrid.com/v1/accounts/${process.env.TEXTGRID_ACCOUNT_SID}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: formData,
    });

    const textGridResult = await textGridResponse.text();
    
    if (!textGridResponse.ok) {
      console.error('TextGrid API error:', textGridResult);
      return res.status(500).json({ error: 'Failed to send SMS', details: textGridResult });
    }

    // Get "SMS Sent" stage ID
    const stageQuery = `
      SELECT id FROM pipeline_stages 
      WHERE campaign_id = $1 AND slug = 'sms_sent'
    `;
    
    const stageResult = await client.query(stageQuery, [lead.campaign_id]);
    
    if (stageResult.rows.length === 0) {
      return res.status(500).json({ error: 'SMS Sent stage not found' });
    }
    
    const smsSentStageId = stageResult.rows[0].id;

    // Begin transaction for database updates
    await client.query('BEGIN');

    try {
      // Record SMS message
      const smsInsert = `
        INSERT INTO sms_messages (
          lead_id,
          message_text,
          phone_number,
          sent_by,
          textgrid_status,
          delivery_status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const smsResult = await client.query(smsInsert, [
        lead_id,
        finalMessage,
        lead.phone,
        sent_by,
        'sent',
        'delivered'
      ]);

      // Update lead: move to SMS Sent stage, increment SMS count, update landing page URL
      const updateLead = `
        UPDATE leads 
        SET current_stage_id = $1,
            sms_sent_count = sms_sent_count + 1,
            landing_page_url = $2,
            updated_at = NOW()
        WHERE id = $3
      `;
      
      await client.query(updateLead, [smsSentStageId, landingPageUrl, lead_id]);

      // Record activity
      const activityInsert = `
        INSERT INTO lead_activities (
          lead_id,
          activity_type,
          description,
          from_stage_id,
          to_stage_id,
          performed_by,
          data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await client.query(activityInsert, [
        lead_id,
        'sms_sent',
        `SMS sent to ${lead.business_name}`,
        lead.current_stage_id,
        smsSentStageId,
        sent_by,
        JSON.stringify({
          message: finalMessage,
          phone: lead.phone,
          landing_page_url: landingPageUrl,
          tracking_id: trackingId,
          textgrid_response: textGridResult
        })
      ]);

      await client.query('COMMIT');
      
      return res.status(200).json({
        success: true,
        message: 'SMS sent successfully and lead moved to SMS Sent stage',
        data: {
          sms_id: smsResult.rows[0].id,
          landing_page_url: landingPageUrl,
          tracking_id: trackingId,
          textgrid_response: textGridResult
        }
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      console.error('Database error during SMS processing:', dbError);
      return res.status(500).json({ 
        error: 'Failed to update database after SMS sent', 
        details: dbError.message 
      });
    }

  } catch (error) {
    console.error('Error sending SMS:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to send SMS and update lead' 
    });
  } finally {
    client.release();
  }
}