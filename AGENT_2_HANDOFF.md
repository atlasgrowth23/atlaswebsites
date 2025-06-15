# 🤝 Agent 2 Handoff - Tenant CRM System Development

## 🎯 Mission: Build Multi-Tenant CRM for HVAC Contractors

You are **Agent 2** and your job is to build out the **tenant-facing CRM system** (`/atlas/*` routes) while **Agent 1** continues working on the admin pipeline system.

## 🏗️ Business Model Context

**Atlas Growth's SaaS Model:**
1. **Nicholas/Jared** sell websites to HVAC contractors via the admin pipeline
2. **Contractors become tenants** with their own CRM system
3. **Google Workspace integration** - Nicholas buys domains, sets up Google Workspace
4. **Each contractor gets** professional CRM at `/atlas/[tenant_slug]/*`
5. **Revenue streams:** Website sales + monthly CRM subscriptions

## 📊 Current Database Architecture

### **Admin System (Agent 1's Domain):**
```sql
-- Admin authentication and management
admin_sessions (email, role, google_tokens, session_token)
pipeline_leads (company_id, stage, notes)
```

### **Tenant System (Your Domain):**
```sql
-- Core tenant management
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID, -- FK to companies (when contractor buys website)
  business_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- NEEDS EXPANSION (see tasks below)
);

-- Customer contacts for HVAC contractors  
CREATE TABLE contacts (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  email TEXT,
  equip_type TEXT, -- HVAC equipment type
  warranty_expiry DATE,
  service_history JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business owner authentication
CREATE TABLE client_users (
  id UUID PRIMARY KEY,
  company_id UUID, -- Links to companies table
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  google_access_token TEXT,
  google_refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main companies directory (shared between admin and tenant systems)
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email_1 TEXT, -- Business owner email
  city TEXT,
  state TEXT,
  website TEXT,
  custom_domain TEXT,
  template_key TEXT,
  -- ... many other fields
);
```

## 🔐 Authentication System Analysis

### **Current Google OAuth Setup:**
```typescript
// Existing admin OAuth (working)
const ADMIN_EMAILS = {
  'nicholas@atlasgrowth.ai': 'super_admin',
  'jared@atlasgrowth.ai': 'admin'
} as const;

// Tenant OAuth (needs enhancement)
// Business owners login with their business email
// Links to companies.email_1 field
// Creates/updates client_users table
```

### **Google OAuth Scopes Available:**
- `userinfo.email` - Basic identification
- `userinfo.profile` - Name and profile  
- `contacts` - Google Contacts management
- `calendar` - Google Calendar access
- `gmail.send` - Email sending capability

## 📁 File Structure You Need to Create

### **Core Tenant Routes:**
```
/pages/atlas/[tenant_slug]/
  ├── index.tsx           # Tenant dashboard
  ├── contacts.tsx        # Customer contact management
  ├── calendar.tsx        # Appointment scheduling
  ├── messages.tsx        # SMS communication center  
  ├── reviews.tsx         # Review management system
  └── settings.tsx        # Tenant configuration

/pages/api/atlas/
  ├── auth/
  │   ├── login.ts        # Tenant Google OAuth
  │   └── callback.ts     # OAuth callback for tenants
  ├── contacts/
  │   ├── [tenant_slug].ts # CRUD operations
  │   └── search.ts       # Contact search/filtering
  ├── calendar/
  │   ├── events.ts       # Calendar event management
  │   └── booking.ts      # Public appointment booking
  ├── messages/
  │   ├── sms.ts          # TextGrid SMS integration
  │   └── templates.ts    # Message templates
  └── reviews/
      ├── request.ts      # Send review requests
      └── tracking.ts     # Review response tracking
```

## 🎯 Your Priority Tasks

### **Phase 1: Foundation (START HERE)**

#### **Task 1: Enhance Tenant Database Schema**
```sql
-- Expand tenants table
ALTER TABLE tenants ADD COLUMN subscription_status TEXT DEFAULT 'trial';
ALTER TABLE tenants ADD COLUMN plan_type TEXT DEFAULT 'basic';
ALTER TABLE tenants ADD COLUMN billing_email TEXT;
ALTER TABLE tenants ADD COLUMN settings JSONB DEFAULT '{}';
ALTER TABLE tenants ADD COLUMN google_workspace_domain TEXT;
ALTER TABLE tenants ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN subscription_expires_at TIMESTAMPTZ;
ALTER TABLE tenants ADD COLUMN features_enabled TEXT[] DEFAULT ARRAY['contacts', 'calendar'];
```

#### **Task 2: Tenant Authentication System**
Create tenant-specific Google OAuth that:
- Uses business owner's professional email (info@contractorname.com)
- Links to their tenant record via companies.email_1
- Creates sessions with tenant context
- Handles Google Workspace domain restrictions

#### **Task 3: Clean Up Contacts System**
Improve existing `/atlas/contacts` with:
- Better search and filtering
- HVAC-specific fields (equipment type, service history)
- Customer communication tracking
- Export functionality

#### **Task 4: Tenant Data Isolation**
Implement proper row-level security:
```sql
-- Enable RLS on tenant tables
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON contacts 
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

### **Phase 2: Calendar Integration**

#### **Task 5: Google Calendar API Integration**
- Use tenant's Google Workspace calendar
- HVAC-specific appointment types (maintenance, repair, installation)
- Technician assignment and scheduling
- Customer confirmation emails

#### **Task 6: Public Booking System**
- Customer-facing appointment booking
- Time slot availability
- Service type selection
- Automated confirmation via SMS/email

### **Phase 3: Review Automation**

#### **Task 7: TextGrid SMS Integration**
Nicholas has 50 SMS numbers ready. Build:
- Automated review request sending
- SMS template management  
- Response tracking and analytics
- Integration with companies.reviews_link

#### **Task 8: Review Management Dashboard**
- Track review requests sent
- Monitor response rates
- Review response templates
- Google/Yelp review monitoring

## 🔧 Technical Patterns to Follow

### **Tenant Context Pattern:**
```typescript
// Every API endpoint should extract tenant context
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tenant_slug } = req.query;
  
  // Get tenant from database
  const tenant = await getTenantBySlug(tenant_slug as string);
  if (!tenant) return res.status(404).json({ error: 'Tenant not found' });
  
  // Set tenant context for database queries
  await setTenantContext(tenant.id);
  
  // Proceed with tenant-scoped operations
}
```

### **Authentication Pattern:**
```typescript
// Tenant-aware authentication
const session = await getTenantSession(req.cookies.tenant_session);
if (!session || session.tenant_id !== tenant.id) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

### **Database Query Pattern:**
```typescript
// All queries must be tenant-scoped
const contacts = await supabase
  .from('contacts')
  .select('*')
  .eq('tenant_id', tenant.id)
  .order('created_at', { ascending: false });
```

## 🚀 Integration Points with Agent 1

### **When Contractor Becomes Tenant:**
1. **Agent 1** marks lead as "sale_made" in pipeline
2. **Webhook/API call** triggers tenant creation
3. **You** create tenant record linked to company
4. **You** send onboarding email with login instructions

### **Shared Resources:**
- `companies` table (read-only for you)
- Google OAuth configuration
- Supabase database connection
- Email/SMS sending infrastructure

## 🛠️ Available Tools & APIs

### **Database Access:**
```typescript
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### **Google APIs:**
- Calendar API for appointment scheduling
- Contacts API for customer management  
- Gmail API for automated emails
- OAuth tokens available via tenant sessions

### **SMS Integration:**
- TextGrid API for automated review requests
- 50 phone numbers ready for assignment
- SMS template system

## 📋 Success Metrics

### **Phase 1 Complete When:**
- ✅ Tenant can log in with Google OAuth
- ✅ Contacts system is polished and functional
- ✅ Proper data isolation between tenants
- ✅ Basic tenant dashboard working

### **Phase 2 Complete When:**
- ✅ Google Calendar integration working
- ✅ Customers can book appointments online
- ✅ Automated confirmation system working

### **Phase 3 Complete When:**
- ✅ Automated review requests via SMS
- ✅ Review tracking and analytics
- ✅ Response template system

## 🤔 Key Decisions Needed

### **Calendar Strategy:**
**Recommendation:** Use Google Calendar API with custom UI
- **Pros:** Syncs with phones, professional, reliable
- **Cons:** Requires Google Workspace setup
- **Why:** HVAC contractors already use Google/Gmail

### **URL Structure:**
**Current:** `/atlas/[tenant_slug]/*`
**Alternative:** `/[tenant_slug]/*` (if you want custom domains later)

### **Multi-User Support:**
**Start:** Single business owner per tenant
**Later:** Multiple users with roles (admin, technician, office)

## 🔍 Current State Analysis

### **What's Working:**
- Basic tenant structure exists
- Contact management partially built
- Google OAuth foundation established
- Admin pipeline system fully operational

### **What Needs Building:**
- Proper tenant authentication
- Enhanced contact management
- Calendar integration
- Review automation system
- Tenant settings and configuration

## 💡 Development Tips

1. **Start Small:** Get basic tenant login working first
2. **Follow Patterns:** Copy authentication patterns from admin system
3. **Test Early:** Use existing companies data for testing
4. **Document Changes:** Update this file as you make decisions
5. **Coordinate:** Check with Agent 1 before modifying shared tables

## 🚨 Important Notes

- **Don't modify** admin_sessions table (Agent 1's domain)
- **Don't modify** pipeline_leads table (Agent 1's domain)  
- **Read-only access** to companies table
- **Create new** tenant-specific tables as needed
- **Coordinate** any schema changes that affect both systems

---

**Good luck building the tenant CRM system! Focus on Phase 1 foundation first, then we can coordinate on integration points.**

**Questions? Document them here and Agent 1 can help resolve any conflicts or shared resource issues.**