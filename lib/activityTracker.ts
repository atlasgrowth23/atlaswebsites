// Activity Tracking Utility
import { supabaseAdmin } from '@/lib/supabase';

export interface ActivityData {
  sessionId?: string;
  leadId: string;
  companyId: string;
  userName: string;
  action: string;
  actionData?: Record<string, any>;
}

// Track activity in database
export async function trackActivity(data: ActivityData) {
  try {
    const { data: result, error } = await supabaseAdmin
      .from('activity_log')
      .insert([{
        session_id: data.sessionId || null,
        lead_id: data.leadId,
        company_id: data.companyId,
        user_name: data.userName,
        action: data.action,
        action_data: data.actionData || {}
      }]);

    if (error) {
      console.error('Activity tracking error:', error);
      return { success: false, error };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Activity tracking failed:', error);
    return { success: false, error };
  }
}

// Get current active session for user
export async function getActiveSession(userName: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('cold_call_sessions')
      .select('*')
      .eq('user_name', userName)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching active session:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Failed to get active session:', error);
    return null;
  }
}

// Start new cold call session
export async function startSession(userName: string) {
  try {
    // End any existing active session first
    await endActiveSession(userName);

    const { data, error } = await supabaseAdmin
      .from('cold_call_sessions')
      .insert([{
        user_name: userName,
        start_time: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error starting session:', error);
      return { success: false, error };
    }

    return { success: true, session: data };
  } catch (error) {
    console.error('Failed to start session:', error);
    return { success: false, error };
  }
}

// End active session
export async function endActiveSession(userName: string) {
  try {
    const activeSession = await getActiveSession(userName);
    if (!activeSession) {
      return { success: true, message: 'No active session to end' };
    }

    // Calculate session stats
    const { data: activities } = await supabaseAdmin
      .from('activity_log')
      .select('action, lead_id')
      .eq('session_id', activeSession.id);

    const leadsProcessed = new Set(activities?.map(a => a.lead_id) || []).size;
    const callsMade = activities?.filter(a => a.action === 'call_started').length || 0;
    const contactsMade = activities?.filter(a => a.action === 'owner_email_added').length || 0;
    const voicemailsLeft = activities?.filter(a => a.action === 'voicemail_part_2_sent').length || 0;

    const { data, error } = await supabaseAdmin
      .from('cold_call_sessions')
      .update({
        end_time: new Date().toISOString(),
        leads_processed: leadsProcessed,
        calls_made: callsMade,
        contacts_made: contactsMade,
        voicemails_left: voicemailsLeft
      })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (error) {
      console.error('Error ending session:', error);
      return { success: false, error };
    }

    return { success: true, session: data };
  } catch (error) {
    console.error('Failed to end session:', error);
    return { success: false, error };
  }
}

// Activity action types
export const ACTIVITY_ACTIONS = {
  PREVIEW_WEBSITE: 'preview_website',
  VIEW_GOOGLE_REVIEWS: 'view_google_reviews',
  CALL_STARTED: 'call_started',
  SMS_ANSWER_CALL: 'sms_answer_call_sent',
  SMS_VOICEMAIL_1: 'sms_voicemail_1_sent',
  SMS_VOICEMAIL_2: 'sms_voicemail_2_sent',
  OWNER_NAME_ADDED: 'owner_name_added',
  OWNER_EMAIL_ADDED: 'owner_email_added',
  NOTE_ADDED: 'note_added',
  TEMPLATE_SAVED: 'template_saved',
  UNSUCCESSFUL_CALL: 'unsuccessful_call_marked'
} as const;