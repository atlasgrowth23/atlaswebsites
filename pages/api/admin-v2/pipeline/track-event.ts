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

  const { lead_id, event_type, tracking_id, data = {} } = req.body;

  if (!lead_id || !event_type) {
    return res.status(400).json({ error: 'Missing required fields: lead_id, event_type' });
  }

  const client = await pool.connect();
  
  try {
    // Get lead and current stage info
    const leadQuery = `
      SELECT 
        l.*,
        ps.name as current_stage_name,
        ps.slug as current_stage_slug,
        c.id as campaign_id
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
    
    await client.query('BEGIN');
    
    try {
      let stageChanged = false;
      let newStageId = lead.current_stage_id;
      let leadUpdates = {};

      // Handle different event types and stage progressions
      switch (event_type) {
        case 'link_clicked':
          // Move from "SMS Sent" to "Link Clicked"
          if (lead.current_stage_slug === 'sms_sent') {
            const nextStage = await client.query(`
              SELECT id FROM pipeline_stages 
              WHERE campaign_id = $1 AND slug = 'link_clicked'
            `, [lead.campaign_id]);
            
            if (nextStage.rows.length > 0) {
              newStageId = nextStage.rows[0].id;
              stageChanged = true;
            }
          }
          
          leadUpdates = {
            link_clicks: lead.link_clicks + 1
          };
          break;

        case 'video_watched':
        case 'video_engaged':
          // Move from "Link Clicked" to "Video Watched"
          if (lead.current_stage_slug === 'link_clicked') {
            const nextStage = await client.query(`
              SELECT id FROM pipeline_stages 
              WHERE campaign_id = $1 AND slug = 'video_watched'
            `, [lead.campaign_id]);
            
            if (nextStage.rows.length > 0) {
              newStageId = nextStage.rows[0].id;
              stageChanged = true;
            }
          }
          
          leadUpdates = {
            video_completed: true,
            video_watch_duration: data.duration || 30
          };
          break;

        case 'button_clicked':
          // Move from "Video Watched" to "Action Taken"
          if (lead.current_stage_slug === 'video_watched') {
            const nextStage = await client.query(`
              SELECT id FROM pipeline_stages 
              WHERE campaign_id = $1 AND slug = 'action_taken'
            `, [lead.campaign_id]);
            
            if (nextStage.rows.length > 0) {
              newStageId = nextStage.rows[0].id;
              stageChanged = true;
            }
          }

          // Record button action separately
          await client.query(`
            INSERT INTO button_actions (
              lead_id,
              button_type,
              button_text,
              page_url,
              session_id,
              ip_address,
              user_agent
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            lead_id,
            data.button_type || 'unknown',
            data.button_text || 'Unknown Button',
            data.page_url || req.headers.referer || '',
            tracking_id,
            req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            req.headers['user-agent'] || ''
          ]);

          // Additional lead updates based on button type
          if (data.button_type === 'view_website') {
            // Move to "Qualified" if they view website
            const qualifiedStage = await client.query(`
              SELECT id FROM pipeline_stages 
              WHERE campaign_id = $1 AND slug = 'qualified'
            `, [lead.campaign_id]);
            
            if (qualifiedStage.rows.length > 0) {
              newStageId = qualifiedStage.rows[0].id;
              stageChanged = true;
            }
          } else if (data.button_type === 'schedule_call') {
            // Move directly to "Qualified" for scheduling
            const qualifiedStage = await client.query(`
              SELECT id FROM pipeline_stages 
              WHERE campaign_id = $1 AND slug = 'qualified'
            `, [lead.campaign_id]);
            
            if (qualifiedStage.rows.length > 0) {
              newStageId = qualifiedStage.rows[0].id;
              stageChanged = true;
            }
          } else if (data.button_type === 'not_interested') {
            // Move to "Dead" stage
            const deadStage = await client.query(`
              SELECT id FROM pipeline_stages 
              WHERE campaign_id = $1 AND slug = 'dead'
            `, [lead.campaign_id]);
            
            if (deadStage.rows.length > 0) {
              newStageId = deadStage.rows[0].id;
              stageChanged = true;
            }
          }
          break;
      }

      // Update lead if needed
      if (Object.keys(leadUpdates).length > 0 || stageChanged) {
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (stageChanged) {
          updateFields.push(`current_stage_id = $${paramIndex++}`);
          updateValues.push(newStageId);
        }

        Object.entries(leadUpdates).forEach(([key, value]) => {
          updateFields.push(`${key} = $${paramIndex++}`);
          updateValues.push(value);
        });

        updateFields.push(`updated_at = NOW()`);
        updateValues.push(lead_id);

        const updateQuery = `
          UPDATE leads 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `;

        await client.query(updateQuery, updateValues);
      }

      // Record activity
      const activityDescription = getActivityDescription(event_type, data, lead.business_name);
      
      await client.query(`
        INSERT INTO lead_activities (
          lead_id,
          activity_type,
          description,
          from_stage_id,
          to_stage_id,
          performed_by,
          data,
          ip_address,
          user_agent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        lead_id,
        event_type,
        activityDescription,
        stageChanged ? lead.current_stage_id : null,
        stageChanged ? newStageId : null,
        'system',
        JSON.stringify({
          ...data,
          tracking_id,
          timestamp: new Date().toISOString(),
          stage_changed: stageChanged
        }),
        req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        req.headers['user-agent'] || ''
      ]);

      await client.query('COMMIT');
      
      return res.status(200).json({
        success: true,
        event_tracked: event_type,
        stage_changed: stageChanged,
        message: stageChanged ? 'Event tracked and stage updated' : 'Event tracked'
      });

    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    }

  } catch (error) {
    console.error('Error tracking event:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to track event' 
    });
  } finally {
    client.release();
  }
}

function getActivityDescription(eventType: string, data: any, businessName: string): string {
  switch (eventType) {
    case 'link_clicked':
      return `Landing page visited by ${businessName}`;
    case 'video_watched':
      return `Video completed by ${businessName}`;
    case 'video_engaged':
      return `Video engagement detected for ${businessName}`;
    case 'button_clicked':
      return `Button clicked: "${data.button_text}" by ${businessName}`;
    default:
      return `${eventType} event for ${businessName}`;
  }
}