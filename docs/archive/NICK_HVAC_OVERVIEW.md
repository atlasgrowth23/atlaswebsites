# HVAC CRM System Overview

## What We've Built So Far

### 1. Smart Chat Widget System
**Location**: Chat widget embedded on HVAC company websites

**Flow**:
1. **Welcome Message**: "Hi! Welcome to [Company]. Send us a message or choose from options below:"
2. **Service Buttons**: 4 clean buttons in 2x2 grid
   - Repair | Install
   - Tune Up | Emergency  
3. **Contact Form**: Appears immediately after service selection
   - First Name | Last Name
   - Phone | Email (one required)
   - Professional consent checkbox
   - No typing allowed until service selected

**Return Visitor Experience**:
- localStorage detects previous contacts
- "Hey John! Good to see you again. What can we help you with?"
- Skips contact form completely

### 2. Database Structure (Clean Slate Design)

#### Core Tables:
```sql
hvac_contacts:
- id, company_id, first_name, last_name
- phone, email (one required)
- status: 'new_lead' | 'existing_customer'  
- source: 'chat_widget' | 'manual'
- created_at, updated_at

hvac_contact_activities:
- contact_id, activity_type, description
- metadata (JSONB for future extensibility)
- created_at

hvac_conversations: (linked to chat widget)
hvac_messages: (stores all chat interactions)
```

#### Current Activity Types:
- `contact_created` - When form submitted
- `chat_service_request` - When user selects Repair/Install/etc
- `chat_message_sent` - When user sends messages

### 3. Planned Backend Interface

**Route Structure**:
- `/hvac/messages` - Live chat conversations
- `/hvac/contacts` - Contact management

**Smart Lists for Contacts**:
- All Contacts
- New Leads (status = new_lead)  
- Existing Customers (status = existing_customer)
- Recent Activity (sorted by latest activity)

## How It Works

### New Visitor Flow:
1. Opens chat → Service selection → Contact form → Contact created
2. localStorage stores their info for future visits
3. All messages linked to their contact record
4. Shows in both /hvac/messages and /hvac/contacts

### Return Visitor Flow:
1. Opens chat → "Hey John!" → Service selection → Direct to messaging
2. No form needed - messages linked to existing contact
3. Updates activity timeline

### Duplicate Detection:
- When form submitted, checks phone/email against existing contacts
- If match found: "Are you John Smith from 555-1234?"
- User confirms identity or creates new contact

## Future Considerations & Questions

### 🤔 Source Field Options (Need Clarification):
**Current**: `chat_widget`, `manual`
**Possible additions**:
- `phone_call` - When admin logs phone calls?
- `website_form` - Other forms on website?  
- `referral` - Customer referrals?
- `social_media` - Facebook/Google leads?

**Question**: What lead sources matter most for your HVAC business?

### 🤔 Status Transitions (Need Clarification):
**When does `new_lead` become `existing_customer`?**
- After first service completed?
- After first payment received?
- Manual admin decision?
- Automatic based on invoice status?

### 🤔 Future Activity Types (Suggestions):
**Service Operations**:
- `estimate_sent` - Pricing provided
- `service_scheduled` - Appointment booked
- `service_completed` - Job finished
- `invoice_sent` - Billing sent
- `payment_received` - Payment processed

**Communication**:
- `phone_call_logged` - Admin logs calls
- `email_sent` - Email communications
- `follow_up_scheduled` - Future contact planned

**Question**: Which activities are most important for tracking lead progression?

### 🤔 Integration Points (Future):
- **Scheduling System**: Link to calendar/appointment booking
- **Invoicing**: Connect to billing/payment system  
- **Service History**: Track all completed jobs
- **Inventory**: Parts used, equipment installed
- **Team Management**: Assign technicians to leads

## Technical Notes

### Cookie System:
- Stores contact info in localStorage per company
- Format: `hvac_contact_${companyId}`
- Enables return visitor recognition
- Falls back gracefully if cookies cleared

### Database Migration:
- New `hvac_*` tables (clean slate)
- Old `contacts`, `conversations` tables preserved as backup
- Chat widget updated to use new schema
- No data loss from existing system

## Next Steps Priority

1. **✅ Build confirmed features** (new_lead/existing_customer statuses)
2. **❓ Clarify business logic** (status transitions, activity types)
3. **🏗️ Implement backend pages** (/hvac/messages, /hvac/contacts)
4. **🔗 Plan integration points** for full HVAC CRM system

**The foundation is solid and extensible - ready to grow into full HVAC business management system.**