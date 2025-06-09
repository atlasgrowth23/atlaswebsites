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

// Track activity in database and trigger auto-stage updates
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

    // Auto-update pipeline stage based on activity
    await autoUpdateLeadStage(data.leadId, data.action);

    // Auto-add tags based on activity
    await autoAddTags(data.leadId, data.action, data.actionData);

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

// Auto-update lead stage based on activity
export async function autoUpdateLeadStage(leadId: string, action: string) {
  try {
    // Get current lead stage
    const { data: lead, error: leadError } = await supabaseAdmin
      .from('lead_pipeline')
      .select('stage')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      console.error('Could not fetch lead for stage update:', leadError);
      return;
    }

    let newStage = null;

    // Stage update logic based on activities
    switch (action) {
      case ACTIVITY_ACTIONS.SMS_ANSWER_CALL:
        // Answer Call Snippet sent = Live Call stage
        if (lead.stage === 'new_lead') {
          newStage = 'live_call';
        }
        break;

      case ACTIVITY_ACTIONS.SMS_VOICEMAIL_1:
        // Voicemail Part 1 sent = Voicemail stage
        if (lead.stage === 'new_lead') {
          newStage = 'voicemail';
        }
        break;

      case ACTIVITY_ACTIONS.UNSUCCESSFUL_CALL:
        // Mark as unsuccessful
        newStage = 'unsuccessful';
        break;

      default:
        // No stage update needed for other actions
        return;
    }

    // Update stage if needed
    if (newStage && newStage !== lead.stage) {
      const { error: updateError } = await supabaseAdmin
        .from('lead_pipeline')
        .update({ 
          stage: newStage,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (updateError) {
        console.error('Failed to auto-update lead stage:', updateError);
      } else {
        console.log(`Auto-updated lead ${leadId} from ${lead.stage} to ${newStage} due to ${action}`);
      }
    }
  } catch (error) {
    console.error('Auto stage update failed:', error);
  }
}

// Auto-add tags based on activities
export async function autoAddTags(leadId: string, action: string, actionData?: Record<string, any>) {
  try {
    const tagsToAdd: string[] = [];

    // Determine which tags to add based on action
    switch (action) {
      case ACTIVITY_ACTIONS.SMS_ANSWER_CALL:
        tagsToAdd.push('answered-call');
        break;
      
      case ACTIVITY_ACTIONS.SMS_VOICEMAIL_1:
        tagsToAdd.push('voicemail-left');
        break;
      
      // Note: viewed-during-call and viewed-after-voicemail will be handled by website tracking
      // return-visitor will be handled by website analytics
    }

    // Add tags via API
    for (const tagType of tagsToAdd) {
      try {
        const response = await fetch('/api/tags/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId,
            tagType,
            createdBy: 'system',
            metadata: { triggeredBy: action, actionData }
          })
        });

        if (!response.ok) {
          console.error(`Failed to add tag ${tagType}:`, await response.text());
        }
      } catch (error) {
        console.error(`Error adding tag ${tagType}:`, error);
      }
    }
  } catch (error) {
    console.error('Auto tag addition failed:', error);
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
  UNSUCCESSFUL_CALL: 'unsuccessful_call_marked',
  APPOINTMENT_SET: 'appointment_set',
  SALE_MADE: 'sale_made',
  CALLBACK_RECEIVED: 'callback_received'
} as const;