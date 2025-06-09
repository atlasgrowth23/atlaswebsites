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
    // Handle both regular JSON and sendBeacon blob/text data
    let requestBody;
    if (typeof req.body === 'string') {
      // sendBeacon blob or text
      requestBody = JSON.parse(req.body);
    } else if (req.body && typeof req.body === 'object') {
      // Regular JSON request
      requestBody = req.body;
    } else {
      throw new Error('Invalid request body format');
    }
    
    const { 
      companyId, 
      sessionId, 
      visitorId,
      templateKey, 
      timeOnPage,
      deviceType,
      deviceModel,
      fingerprint,
      userAgent,
      referrer,
      pageUrl,
      pageTitle,
      isInitial 
    } = requestBody;
    
    // Debug logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Tracking payload received:', {
        companyId,
        sessionId,
        visitorId,
        templateKey,
        timeOnPage,
        deviceModel
      });
    }
    
    // Validate required fields
    if (!companyId || !sessionId || !templateKey) {
      console.error('❌ Missing required fields:', { 
        companyId: !!companyId, 
        sessionId: !!sessionId, 
        templateKey: !!templateKey 
      });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['companyId', 'sessionId', 'templateKey']
      });
    }

    // Get company slug
    let companySlug = null;
    try {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('slug')
        .eq('id', companyId)
        .single();
      
      companySlug = company?.slug || null;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Fetched company slug:', companySlug);
      }
    } catch (error) {
      console.error('⚠️ Could not fetch company slug:', error);
    }

    // Get IP address
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress) || 'unknown';

    // Enhanced device and browser detection
    const detectedDeviceType = deviceType || detectDeviceType(userAgent || 'Unknown');
    const browserName = detectBrowserName(userAgent || 'Unknown');

    // Check if this is a return visitor
    const isReturnVisitor = await checkReturnVisitor(visitorId, companyId, sessionId);

    // Check for existing session
    const { data: existingView } = await supabaseAdmin
      .from('template_views')
      .select('id, total_time_seconds, page_interactions, visit_start_time, visitor_id')
      .eq('session_id', sessionId)
      .eq('company_id', companyId)
      .single();

    const now = new Date().toISOString();
    const isInitialVisit = isInitial ?? !existingView;
    
    const trackingData = {
      company_id: companyId,
      company_slug: companySlug,
      template_key: templateKey,
      session_id: sessionId,
      visitor_id: visitorId,
      user_agent: userAgent || 'Unknown',
      referrer_url: referrer || null,
      ip_address: ip !== 'unknown' ? ip : null,
      device_type: detectedDeviceType,
      device_model: deviceModel || null,
      browser_name: browserName,
      page_title: pageTitle || null,
      is_return_visitor: isReturnVisitor,
      total_time_seconds: Math.min(timeOnPage || 0, 1800), // Cap at 30 minutes
      page_interactions: 1 + (existingView?.page_interactions || 0),
      is_initial_visit: isInitialVisit,
      visit_start_time: isInitialVisit ? now : existingView?.visit_start_time || now,
      visit_end_time: isInitialVisit ? null : now,
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
      updateDailyAnalytics(companyId, deviceType).catch(console.error);
      autoUpdatePipelineStage(companyId).catch(console.error);
    }

    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      timeRecorded: trackingData.total_time_seconds,
      isUpdate: !!existingView,
      trackingId: result.id,
      templateKey: templateKey
    });

  } catch (error) {
    console.error('Analytics tracking error:', error);
    
    // For sendBeacon requests, just return 200 even on error to avoid browser retries
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('text/plain') || contentType.includes('application/json') && typeof req.body === 'string') {
      return res.status(200).json({ success: false, error: 'tracking failed' });
    }
    
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

// Improved return visitor detection focused on visitor_id
async function checkReturnVisitor(visitorId: string, companyId: string, currentSessionId: string): Promise<boolean> {
  if (!visitorId || visitorId.startsWith('temp_')) return false;
  
  try {
    // Check if this visitor_id has visited this company before (excluding current session)
    const { data: existingVisits } = await supabaseAdmin
      .from('template_views')
      .select('id')
      .eq('visitor_id', visitorId)
      .eq('company_id', companyId)
      .neq('session_id', currentSessionId)
      .limit(1);
    
    return existingVisits && existingVisits.length > 0;
  } catch (error) {
    console.error('Error checking return visitor:', error);
    return false;
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