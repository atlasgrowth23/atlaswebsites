import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

interface TrackingPayload {
  companyId: string;
  companySlug: string;
  templateKey: string;
  sessionId: string;
  timeOnPage: number;
  userAgent: string;
  referrer?: string;
  viewport?: { width: number; height: number };
  timestamp?: string;
  location?: { latitude: number; longitude: number };
  isInitial?: boolean;
  interactions?: number;
}

// Professional unified tracking API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload: TrackingPayload = req.body;
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Tracking payload received:', {
        companyId: payload.companyId,
        sessionId: payload.sessionId,
        templateKey: payload.templateKey,
        timeOnPage: payload.timeOnPage
      });
    }
    
    // Validate required fields
    if (!payload.companyId || !payload.sessionId || !payload.templateKey) {
      console.error('❌ Missing required fields:', { 
        companyId: !!payload.companyId, 
        sessionId: !!payload.sessionId, 
        templateKey: !!payload.templateKey 
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['companyId', 'sessionId', 'templateKey'],
        received: payload
      });
    }

    // Get company slug if not provided
    let companySlug = payload.companySlug;
    if (!companySlug) {
      try {
        const { data: company } = await supabaseAdmin
          .from('companies')
          .select('slug')
          .eq('id', payload.companyId)
          .single();
        
        companySlug = company?.slug || null;
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Fetched company slug:', companySlug);
        }
      } catch (error) {
        console.error('⚠️ Could not fetch company slug:', error);
      }
    }

    // Get IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || 'unknown';

    // Enhanced device and browser detection
    const userAgent = payload.userAgent || 'Unknown';
    const deviceType = detectDeviceType(userAgent);
    const browserName = detectBrowserName(userAgent);

    // Check for existing session
    const { data: existingView } = await supabaseAdmin
      .from('template_views')
      .select('id, total_time_seconds, page_interactions, visit_start_time, latitude, longitude')
      .eq('session_id', payload.sessionId)
      .eq('company_id', payload.companyId)
      .single();

    const now = payload.timestamp || new Date().toISOString();
    const isInitial = payload.isInitial ?? !existingView;
    
    const trackingData = {
      company_id: payload.companyId,
      company_slug: companySlug,
      template_key: payload.templateKey,
      session_id: payload.sessionId,
      user_agent: userAgent,
      referrer_url: payload.referrer || null,
      ip_address: ip !== 'unknown' ? ip : null,
      latitude: null,
      longitude: null,
      device_type: deviceType,
      browser_name: browserName,
      total_time_seconds: Math.min(payload.timeOnPage || 0, 1800), // Cap at 30 minutes
      page_interactions: (payload.interactions || 1) + (existingView?.page_interactions || 0),
      is_initial_visit: isInitial,
      visit_start_time: isInitial ? now : existingView?.visit_start_time || now,
      visit_end_time: !isInitial ? now : null,
      updated_at: now
    };

    let result;
    
    if (existingView) {
      // Update existing session
      const { data, error } = await supabaseAdmin
        .from('template_views')
        .update({
          total_time_seconds: Math.min(Math.max(trackingData.total_time_seconds, existingView.total_time_seconds || 0), 1800),
          page_interactions: trackingData.page_interactions,
          visit_end_time: trackingData.visit_end_time,
          latitude: null,
          longitude: null,
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
      
      // Update daily analytics and pipeline stage for new sessions
      updateDailyAnalytics(payload.companyId, deviceType).catch(console.error);
      autoUpdatePipelineStage(payload.companyId).catch(console.error);
    }

    return res.status(200).json({
      success: true,
      sessionId: payload.sessionId,
      timeRecorded: trackingData.total_time_seconds,
      isUpdate: !!existingView,
      trackingId: result.id,
      templateKey: payload.templateKey
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return res.status(500).json({
      error: 'Failed to track analytics',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

// Enhanced device detection
function detectDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Enhanced browser detection
function detectBrowserName(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('chrome/')) return 'Chrome';
  if (ua.includes('firefox/')) return 'Firefox';
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari';
  if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera';
  return 'Other';
}

// Background function to update daily analytics
async function updateDailyAnalytics(companyId: string, deviceType: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
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
    const { data: pipelineLead } = await supabaseAdmin
      .from('lead_pipeline')
      .select('id, stage')
      .eq('company_id', companyId)
      .single();

    if (!pipelineLead || pipelineLead.stage !== 'contacted') return;

    await supabaseAdmin
      .from('lead_pipeline')
      .update({
        stage: 'website_viewed',
        last_contact_date: new Date().toISOString()
      })
      .eq('id', pipelineLead.id);

    await supabaseAdmin
      .from('contact_log')
      .insert({
        company_id: companyId,
        stage_from: 'contacted',
        stage_to: 'website_viewed',
        notes: 'Auto-moved: First website visit detected',
        created_by: 'system'
      });

  } catch (error) {
    console.error('Error in auto pipeline stage update:', error);
  }
}