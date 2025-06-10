# Atlas Voice System - Complete Implementation Guide

## Overview
Atlas is a conversational voice assistant for HVAC contractors to manage customers, equipment, and service operations entirely hands-free. Instead of rigid commands, Atlas understands natural conversation.

## Current Voice Commands (Phase 1)

### 1. Greetings & Help
**Say any of these:**
- "Sup Atlas" / "Hey Atlas" / "What's up Atlas"
- "Atlas" (by itself)

**Atlas responds:** "Sup! I can create contacts, update info, add notes, lookup customers, or get directions. What do you need?"

### 2. Create New Customer
**Natural examples:**
- "Atlas, create a contact for James Smith"
- "Add a new customer named Mark Brown, phone 601-555-1212"
- "Create contact for Lisa, her number is 555-123-4567, email lisa@test.com"

**Atlas responds:** "Contact created for [Name]."

### 3. Look Up Customer Info
**Natural examples:**
- "Atlas, do you see the contact named Sandy Sanders?"
- "What's James Smith's serial number?"
- "Tell me about Sandy"
- "Do you have info for Mark Brown?"

**Atlas responds:** 
- Full info: "Yes, Sandy Sanders - phone (601) 555-0101, located at 31 Bridgeport Ln, Madison, has central AC with serial AB-12345"
- Specific field: "James Smith's serial number is GH-33445"

### 4. Update Customer Data
**Natural examples:**
- "Can we change Sandy's serial number to AB-99999?"
- "Update James Smith's phone to 601-555-9999"
- "Change Mark's filter size to 20x25x1"

**Supported fields:** serial number, model number, filter size, phone, email, equipment type

**Atlas responds:** "Updated [Name]'s [field]."

### 5. Add Notes to Customer
**Natural examples:**
- "Note for Sandy: customer called about weird noise in unit"
- "Add a note for James - prefers morning appointments"
- "Note for Mark: warranty expires next month, schedule inspection"

**Atlas responds:** "Note added for [Name]."

### 6. Get Directions/Distance
**Natural examples:**
- "How far am I from Sandy Sanders?"
- "Distance to James Smith"
- "How far to Sandy's place?"

**Atlas responds:** "About 12 minutes, 7.4 miles to Sandy Sanders. Should I open directions?"
- Say "yes" to open Google Maps

---

## Testing & Practice

### Test with Your Current Customers
You have these customers set up for testing:
- **Sandy Sanders** - Madison, MS (central AC, serial AB-12345)
- **Judith Harrison** - Jackson, MS (furnace, serial EF-11223)  
- **Mark Johnson** - Jackson, MS (mini split, serial GH-33445)
- **Laney Sanders** - Jackson, MS (heat pump, serial CD-67890)

### Practice Session Workflow
1. **Start simple:** "Sup Atlas" (should greet you back)
2. **Test lookup:** "Do you see Sandy Sanders?" (should give full info)
3. **Test specific field:** "What's Sandy's serial number?" (should say AB-12345)
4. **Test update:** "Change Sandy's serial to XYZ-999" (should confirm update)
5. **Test note:** "Note for Sandy: tested voice system" (should confirm)
6. **Test distance:** "How far to Sandy?" (should give distance if location enabled)

### Performance Expectations
- **Response time:** 2-4 seconds
- **Accuracy in quiet environment:** 85-90%
- **Accuracy with background noise:** 70-80%
- **Mobile vs desktop:** Similar performance

---

## Multi-Tenant Setup (Different Accounts)

### Current Setup (Development)
- All testing uses one tenant ID: `fb8681ab-f3e3-46c4-85b2-ea4aa0816adf`
- All demo customers belong to this tenant

### Production Multi-Tenant Architecture
```javascript
// Each HVAC business gets their own tenant
const tenants = {
  "smith-hvac": {
    tenant_id: "uuid-1",
    business_name: "Smith HVAC Services",
    owner_email: "john@smithhvac.com",
    voice_settings: {
      voice_speed: 1.0,
      voice_accent: "southern"
    }
  },
  "jackson-cooling": {
    tenant_id: "uuid-2", 
    business_name: "Jackson Cooling Solutions",
    owner_email: "mike@jacksoncooling.com",
    voice_settings: {
      voice_speed: 1.2,
      voice_accent: "neutral"
    }
  }
}
```

### Voice Customization per Account
```sql
-- Add to tenants table
ALTER TABLE tenants ADD COLUMN voice_settings JSONB DEFAULT '{}';

-- Example voice settings
{
  "voice_speed": 1.1,        -- 0.5 to 2.0
  "voice_pitch": 1.0,        -- 0.5 to 2.0  
  "voice_accent": "southern", -- "neutral", "southern", "midwest"
  "wake_words": ["Atlas", "Hey Atlas", "Computer"]
}
```

---

## Scaling Atlas for Full HVAC Software

### Phase 2: Scheduling & Jobs
**Voice commands to add:**
```
"Atlas, schedule Sandy for Tuesday at 2 PM"
→ Creates calendar appointment

"Who do I have scheduled tomorrow?"
→ Lists appointments with addresses and notes

"Atlas, mark the Johnson job as complete"
→ Updates job status, triggers invoicing

"What jobs are overdue?"
→ Lists jobs past scheduled dates
```

**Required database additions:**
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  contact_id UUID,
  scheduled_date TIMESTAMPTZ,
  job_type VARCHAR(50), -- "maintenance", "repair", "installation"
  status VARCHAR(20),   -- "scheduled", "in_progress", "completed"
  estimated_duration INTEGER, -- minutes
  notes TEXT
);

CREATE TABLE job_statuses (
  id UUID PRIMARY KEY,
  appointment_id UUID,
  status VARCHAR(20),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  location_lat DECIMAL,
  location_lng DECIMAL -- for "I'm at the job site" check-ins
);
```

### Phase 3: Technician Management
**Voice commands:**
```
"Atlas, assign the Sandy job to Mike"
→ Assigns technician to job

"Is Mike available Thursday morning?"
→ Checks technician schedule

"Atlas, Mike is running late to the Johnson job"
→ Updates job status, notifies customer
```

**Database additions:**
```sql
CREATE TABLE technicians (
  id UUID PRIMARY KEY,
  tenant_id UUID,
  name VARCHAR(100),
  phone VARCHAR(20),
  skills JSONB, -- ["heat_pump", "central_ac", "commercial"]
  current_location_lat DECIMAL,
  current_location_lng DECIMAL,
  status VARCHAR(20) -- "available", "on_job", "off_duty"
);

CREATE TABLE job_assignments (
  id UUID PRIMARY KEY,
  appointment_id UUID,
  technician_id UUID,
  assigned_at TIMESTAMPTZ,
  travel_time_estimate INTEGER -- minutes
);
```

### Phase 4: Invoicing & Estimates
**Voice commands:**
```
"Atlas, create an invoice for the Sandy job"
→ Generates invoice from completed work

"What's the estimate for Sandy's heat pump repair?"
→ AI-powered estimate based on similar jobs

"Atlas, email the Johnson invoice"
→ Sends invoice via email automatically
```

**Database additions:**
```sql
CREATE TABLE estimates (
  id UUID PRIMARY KEY,
  contact_id UUID,
  equipment_type VARCHAR(50),
  issue_description TEXT,
  labor_hours DECIMAL,
  parts_cost DECIMAL,
  total_estimate DECIMAL,
  created_at TIMESTAMPTZ
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY,
  appointment_id UUID,
  estimate_id UUID,
  labor_cost DECIMAL,
  parts_cost DECIMAL,
  tax_amount DECIMAL,
  total_amount DECIMAL,
  status VARCHAR(20), -- "draft", "sent", "paid"
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);
```

### Phase 5: Email & Communication
**Voice commands:**
```
"Atlas, draft an email to Sandy about her upcoming service"
→ AI-generated professional email

"Send a reminder to all customers with maintenance due"
→ Bulk email to filtered customer list

"Atlas, text Mike that I'm running 20 minutes late"
→ SMS to technician
```

**Integration points:**
- **SendGrid** for professional emails
- **Twilio** for SMS notifications
- **GPT-4** for drafting professional communications
- **Template system** for common messages

---

## Testing Strategy for Each Phase

### Phase 1 Testing (Current - Contacts)
```bash
# Test contact creation
"Atlas, create contact for Test User, phone 555-123-4567"

# Verify in database
node -e "console.log('Check contacts table for Test User')"

# Test all CRUD operations
"What's Test User's info?"
"Update Test User's phone to 555-999-8888"  
"Note for Test User: voice test successful"
```

### Phase 2 Testing (Scheduling)
```bash
# Test appointment creation
"Atlas, schedule Sandy for Monday at 10 AM"

# Verify scheduling logic
"Who do I have scheduled tomorrow?" 
"Move the Sandy appointment to Tuesday"
"Cancel the Johnson job"

# Test conflict detection
"Schedule Mike at 2 PM" (when he's already booked)
```

### Phase 3 Testing (Technician Management)
```bash
# Test technician assignment
"Atlas, assign the Sandy job to Mike"
"Is Mike available Friday afternoon?"

# Test location tracking
"Atlas, Mike is at the Johnson job site"
"How far is Mike from his next appointment?"

# Test status updates
"Mark Mike as off duty"
"Mike finished the Sandy job"
```

### Automated Testing Framework
```javascript
// test/voice-commands.test.js
const voiceTests = [
  {
    command: "sup atlas",
    expectedIntent: "help",
    expectedResponse: /Sup! I can help/
  },
  {
    command: "create contact for John Doe",
    expectedIntent: "create_contact", 
    expectedData: { name: "John Doe" }
  },
  {
    command: "what's Sandy's serial number",
    expectedIntent: "lookup_contact",
    expectedData: { contact_name: "Sandy", field_requested: "serial_number" }
  }
];

async function runVoiceTests() {
  for (const test of voiceTests) {
    const result = await classifyIntent(test.command, TEST_TENANT_ID);
    assert.equal(result.intent, test.expectedIntent);
    // ... more assertions
  }
}
```

---

## Best Practices for HVAC Voice Software

### 1. Voice Command Design
- **Use customer names consistently** - Train staff to always say full names
- **Keep responses short** - Mobile users are often driving or working
- **Confirm destructive actions** - "Delete the Johnson job?" → "Say yes to confirm"
- **Provide alternatives** - "I didn't catch that. Try: Schedule job, Update customer, or Get directions"

### 2. Data Integrity
- **Voice logs everything** - Every command logged for debugging and training
- **Undo functionality** - "Atlas, undo that last change"
- **Backup confirmations** - Critical data changes get SMS confirmations

### 3. Mobile/Field Optimization
- **Offline queueing** - Commands work offline, sync when connected
- **Location awareness** - "Atlas, I'm at the job site" auto-updates status
- **Hands-free operation** - Works with Bluetooth headsets while driving

### 4. Business Intelligence Integration
```javascript
// Atlas learns your business patterns
"Atlas, any patterns I should know about?"
→ "You've had 8 heat pump refrigerant leaks this month, all on 2019-2021 Carrier units. Might be worth checking other Carrier customers proactively."

"Atlas, how's business looking?"
→ "Revenue up 15% vs last month. You're averaging 2.3 hours per job, which is efficient. Sandy Sanders hasn't had service in 6 months - she's probably due for a filter change."
```

### 5. Compliance & Professional Standards
- **HIPAA-style privacy** - Customer data never leaves secure infrastructure
- **Professional voice training** - Atlas speaks professionally to match your brand
- **Audit trails** - Every change tracked for business/legal purposes

---

## Implementation Roadmap

### Month 1: Core Voice System
- ✅ Natural language processing for contacts
- ✅ Customer lookup and updates  
- ✅ Multi-tenant architecture
- 🔄 Voice customization per account
- 🔄 Mobile app integration

### Month 2: Scheduling System
- 📅 Calendar integration (Google Calendar, Outlook)
- 📅 Appointment management via voice
- 📅 Customer reminder system
- 📅 Conflict detection and resolution

### Month 3: Field Operations
- 🛠️ Technician assignment and tracking
- 🛠️ Job status updates via voice
- 🛠️ Real-time location tracking
- 🛠️ Travel time optimization

### Month 4: Business Intelligence
- 📊 Revenue and performance analytics
- 📊 Predictive maintenance recommendations
- 📊 Customer retention insights
- 📊 Equipment failure pattern detection

### Month 5: Communication Hub
- 📧 AI-generated professional emails
- 📧 SMS notification system
- 📧 Customer portal integration
- 📧 Review and feedback automation

### Month 6: Advanced Features
- 🤖 Predictive scheduling based on weather
- 🤖 Inventory management via voice
- 🤖 AI-powered troubleshooting assistance
- 🤖 Integration with IoT equipment sensors

---

## Getting Started Today

1. **Test current voice system** at `/contacts`
2. **Practice with your demo customers** (Sandy, Judith, Mark, Laney)
3. **Try natural conversations** - don't use rigid commands
4. **Report what works/doesn't work** for continuous improvement
5. **Plan your Phase 2 features** based on your daily workflow needs

Atlas is designed to grow with your business - start simple, add features as you need them, and always prioritize what saves you the most time in your daily operations.