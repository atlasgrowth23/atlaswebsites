# Cold Call Pipeline System - Current Status

## **System Overview**
Complete cold call session tracking system with automated pipeline progression, activity logging, and session analytics.

## **Pipeline Stages (Option B - Implemented)**
```
1. New Lead → Ready to contact
2. Live Call → Answer Call Snippet sent (talked to them)
3. Voicemail → Voicemail snippets sent (left voicemail)
4. Site Viewed → They visited the website (auto-triggered)
5. Appointment → Manual button
6. Sale Made → Manual button
7. Unsuccessful → Red button (existing)
```

## **Auto-Stage Transitions (Working)**
- `New Lead` → `Live Call` (when Answer Call Snippet sent)
- `New Lead` → `Voicemail` (when Voicemail Part 1 sent)
- `Live Call`/`Voicemail` → `Site Viewed` (when website visited)
- Any stage → `Unsuccessful` (manual button)

## **Activity Tracking (Implemented)**
```javascript
// All actions tracked in activity_log table:
PREVIEW_WEBSITE: 'preview_website'
VIEW_GOOGLE_REVIEWS: 'view_google_reviews'
CALL_STARTED: 'call_started'
SMS_ANSWER_CALL: 'sms_answer_call_sent'
SMS_VOICEMAIL_1: 'sms_voicemail_1_sent'
SMS_VOICEMAIL_2: 'sms_voicemail_2_sent'
OWNER_NAME_ADDED: 'owner_name_added'
OWNER_EMAIL_ADDED: 'owner_email_added'
NOTE_ADDED: 'note_added'
TEMPLATE_SAVED: 'template_saved'
UNSUCCESSFUL_CALL: 'unsuccessful_call_marked'
APPOINTMENT_SET: 'appointment_set'
SALE_MADE: 'sale_made'
CALLBACK_RECEIVED: 'callback_received'
```

## **Session Management (Working)**
- Start/end sessions via `/admin/sessions` page
- Real-time session controls in pipeline header
- Session stats: leads_processed, calls_made, contacts_made, voicemails_left
- Activity tracking with session_id context

## **UI Components Status**

### **LeadSidebar Quick Actions:**
✅ Call button (always visible)
✅ Unsuccessful call button (active session only)
✅ Preview website button (always visible)
✅ Google reviews button (always visible)
✅ Manual actions dropdown (Set Appointment, Mark Sale, Callback)

### **Tabs:**
✅ Overview - business info, review analytics
✅ Notes - owner name/email, notes with types
✅ Activity - timeline of all actions
✅ SMS - snippets with tracking
✅ Site Analytics - website visit data
✅ Template - customization editor

## **Database Tables**
```sql
-- Session tracking
cold_call_sessions (id, user_name, start_time, end_time, leads_processed, calls_made, contacts_made, voicemails_left)

-- Activity logging
activity_log (id, session_id, lead_id, company_id, user_name, action, action_data, created_at)

-- Pipeline management
lead_pipeline (id, company_id, stage, notes, created_at, updated_at)

-- Website analytics (existing)
template_views (id, company_id, session_id, visitor_id, total_time_seconds, visit_start_time, visit_end_time, is_return_visitor)
```

## **Call End Detection (Current Logic)**
Call ends when:
- Owner email added (successful call)
- Owner name changed 
- Note added
- Unsuccessful call button clicked

## **Still To Do**
🔄 **Tags System** - auto tags (answered-call, voicemail-left, viewed-during-call) + manual tags
🔄 **Comprehensive API Testing** - edge cases, concurrent sessions, error scenarios
🔄 **Call End Trigger Refinement** - more robust detection
🔄 **Test Company Setup** - Jared, grandmother numbers for real testing

## **API Endpoints (Working)**
```
/api/sessions - GET sessions, POST start/end
/api/sessions/start - POST start session
/api/sessions/end - POST end session
/api/sessions/[sessionId]/activities - GET session activities
/api/activity/track - POST track activity
/api/activity/lead/[leadId] - GET lead activities
/api/analytics/track - POST website visit (auto-stages to site_viewed)
/api/pipeline/leads - GET pipeline data
/api/pipeline/move-lead - POST stage changes
```

## **User Workflow (Tested)**
1. Start session
2. Click business card → opens LeadSidebar
3. Preview website (tracked)
4. View Google reviews (tracked)
5. Click call button (tracked)
6. If answer: Send answer call snippet → auto-stage to Live Call
7. If no answer: Wait 5s, call again, send voicemail snippets → auto-stage to Voicemail
8. Add owner email/notes (ends call window)
9. If they visit website → auto-stage to Site Viewed
10. Manual actions via dropdown (Appointment, Sale, Callback)
11. End session

## **Integration Points**
- Pipeline header shows active session with real-time duration
- Session controls in pipeline (start/end buttons)
- Activity tracking connects to sessions for analytics
- Website analytics auto-updates pipeline stages
- Manual actions update both activities and stages

## **Next Phase**
Focus on tags system implementation and stress testing with real phone numbers.