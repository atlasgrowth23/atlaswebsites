import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';

interface TrackingData {
  companySlug: string;
  templateKey: string;
  companyId: string;
  sessionId: string;
  timeOnPage: number;
  userAgent: string;
  referrer: string;
  isInitial: boolean;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      companySlug,
      templateKey,
      companyId,
      sessionId,
      timeOnPage,
      userAgent,
      referrer,
      isInitial,
      location
    }: TrackingData = req.body;

    // Validate required fields
    if (!companySlug || !templateKey || !companyId || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['companySlug', 'templateKey', 'companyId', 'sessionId']
      });
    }

    // Get IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || 'unknown';

    // Basic device type detection
    const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 
                      /Tablet/.test(userAgent) ? 'tablet' : 'desktop';

    // Basic browser detection
    const browserName = userAgent.includes('Chrome') ? 'Chrome' :
                       userAgent.includes('Firefox') ? 'Firefox' :
                       userAgent.includes('Safari') ? 'Safari' :
                       userAgent.includes('Edge') ? 'Edge' : 'Other';

    // Check if this session already exists
    const { data: existingView } = await supabaseAdmin
      .from('template_views')
      .select('id, total_time_seconds, page_interactions, latitude, longitude')
      .eq('session_id', sessionId)
      .eq('company_id', companyId)
      .single();

    const trackingData = {
      company_id: companyId,
      company_slug: companySlug,
      template_key: templateKey,
      session_id: sessionId,
      user_agent: userAgent,
      referrer_url: referrer || null,
      ip_address: ip !== 'unknown' ? ip : null,
      latitude: location?.latitude || null,
      longitude: location?.longitude || null,
      device_type: deviceType,
      browser_name: browserName,
      total_time_seconds: Math.max(timeOnPage || 0, 1), // Ensure at least 1 second
      page_interactions: (existingView?.page_interactions || 0) + 1,
      is_initial_visit: isInitial,
      visit_start_time: isInitial ? new Date().toISOString() : undefined,
      visit_end_time: !isInitial ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    };

    let result;
    
    if (existingView) {
      // Update existing session
      const { data, error } = await supabaseAdmin
        .from('template_views')
        .update({
          total_time_seconds: Math.max(trackingData.total_time_seconds, existingView.total_time_seconds || 0),
          page_interactions: trackingData.page_interactions,
          visit_end_time: trackingData.visit_end_time,
          latitude: trackingData.latitude || existingView.latitude,
          longitude: trackingData.longitude || existingView.longitude,
          updated_at: trackingData.updated_at
        })
        .eq('id', existingView.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new session
      const { data, error } = await supabaseAdmin
        .from('template_views')
        .insert([trackingData])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Update daily analytics in the background (don't wait for it)
    updateDailyAnalytics(companyId, deviceType).catch(console.error);

    // Auto-update pipeline stage if this is a new visit and they're in "contacted" stage
    if (!existingView && isInitial) {
      autoUpdatePipelineStage(companyId).catch(console.error);
      // Add website view note to pipeline
      addWebsiteViewNote(companyId, deviceType, ip).catch(console.error);
    }

    return res.status(200).json({
      success: true,
      sessionId,
      timeOnPage: trackingData.total_time_seconds,
      isUpdate: !!existingView,
      trackingId: result.id
    });

  } catch (error) {
    console.error('Error tracking template view:', error);
    return res.status(500).json({
      error: 'Failed to track template view',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// Background function to update daily analytics
async function updateDailyAnalytics(companyId: string, deviceType: string) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Get today's stats
    const { data: todayViews } = await supabaseAdmin
      .from('template_views')
      .select('session_id, device_type')
      .eq('company_id', companyId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`);

    if (!todayViews) return;

    const uniqueSessions = new Set(todayViews.map(v => v.session_id)).size;
    const totalViews = todayViews.length;
    const mobileViews = todayViews.filter(v => v.device_type === 'mobile').length;
    const mobilePercentage = totalViews > 0 ? (mobileViews / totalViews) * 100 : 0;

    // Upsert daily analytics
    await supabaseAdmin
      .from('daily_analytics')
      .upsert({
        company_id: companyId,
        date: today,
        total_views: totalViews,
        unique_sessions: uniqueSessions,
        mobile_percentage: Math.round(mobilePercentage * 100) / 100,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'company_id,date'
      });

  } catch (error) {
    console.error('Error updating daily analytics:', error);
  }
}

// Background function to auto-update pipeline stage
async function autoUpdatePipelineStage(companyId: string) {
  try {
    // Check if company is in pipeline and in "contacted" stage
    const { data: pipelineLead, error: pipelineError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('id, stage')
      .eq('company_id', companyId)
      .single();

    if (pipelineError || !pipelineLead) {
      return; // Company not in pipeline, ignore
    }

    // Only auto-move if they're in "contacted" stage
    if (pipelineLead.stage === 'contacted') {
      // Update to "website_viewed" stage
      const { error: updateError } = await supabaseAdmin
        .from('lead_pipeline')
        .update({
          stage: 'website_viewed',
          last_contact_date: new Date().toISOString()
        })
        .eq('id', pipelineLead.id);

      if (updateError) {
        console.error('Error updating pipeline stage:', updateError);
        return;
      }

      // Log the automatic stage change
      await supabaseAdmin
        .from('contact_log')
        .insert({
          company_id: companyId,
          stage_from: 'contacted',
          stage_to: 'website_viewed',
          notes: 'Auto-moved: First website visit detected',
          created_by: 'system'
        });

      console.log(`✅ Auto-moved company ${companyId} to website_viewed stage`);
    }
  } catch (error) {
    console.error('Error in auto pipeline stage update:', error);
  }
}

// Function to add website view note to pipeline
async function addWebsiteViewNote(companyId: string, deviceType: string, ipAddress: string) {
  try {
    // Check if company is in pipeline
    const { data: pipelineLead, error: pipelineError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('id')
      .eq('company_id', companyId)
      .single();

    if (pipelineError || !pipelineLead) {
      return; // Company not in pipeline, ignore
    }

    // Get location info from IP (simple approach)
    let locationInfo = '';
    try {
      // You could integrate with an IP geolocation service here
      // For now, just use basic device info
      locationInfo = deviceType === 'mobile' ? ' from Mobile' : 
                    deviceType === 'tablet' ? ' from Tablet' : 
                    ' from Desktop';
    } catch (error) {
      console.error('Error getting location:', error);
    }

    // Create website view note
    const noteContent = `Website viewed at ${new Date().toLocaleTimeString()}${locationInfo}`;

    // Add note to pipeline
    const { error: noteError } = await supabaseAdmin
      .from('lead_notes')
      .insert({
        lead_id: pipelineLead.id,
        content: noteContent,
        is_private: false,
        created_by: 'system'
      });

    if (noteError) {
      console.error('Error adding website view note:', noteError);
    } else {
      console.log(`✅ Added website view note for company ${companyId}`);
    }

  } catch (error) {
    console.error('Error in addWebsiteViewNote:', error);
  }
}