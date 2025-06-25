# CRITICAL AGENT HANDOFF - READ THESE FILES

## 🚨 MUST READ FILES (IN ORDER):

1. **AGENT_TAKEOVER.md** - Current status, critical issues
2. **CLAUDE_HVAC.md** - Core development philosophy and updated status  
3. **NICK_HVAC_OVERVIEW.md** - Complete system overview and future plans
4. **CLLAUDE?REPLITMMD.md** - Database operations and technical instructions

## 🔥 CRITICAL ISSUES TO FIX:

### **1. Multi-Tenant Architecture Decision (URGENT)**
- Currently HVAC tables link to `companies` directly
- Also have `tenants` table that links to `companies`  
- **DECISION NEEDED**: Use companies directly OR switch to tenants system?
- **Business Model**: Prospects vs Paid customers - how to handle?

### **2. Company Filtering Missing (BLOCKING DEMOS)**
- `/hvac/contacts` shows ALL companies' data mixed together
- Need company slug filtering: `?company=ready-heating-air`
- Already have `companies.slug` field - use this for filtering

### **3. Authentication Strategy (FOR SALES)**
- **Prospect Phase**: URL-based access (`?company=slug`) - no auth needed
- **Customer Phase**: Proper authentication after conversion
- Nick needs to demo to prospects: "Here's your data in our software"

## ✅ COMPLETED WORK:

### **Database:**
- `hvac_contacts`, `hvac_contact_activities`, `hvac_conversations`, `hvac_messages` 
- Professional demo data seeded (12 realistic contacts)
- Fixed missing company_id in activities table
- Demo mode toggle working

### **Frontend:**
- Professional `/hvac/contacts` page with FieldD-inspired design
- Working chat widget with button-based service selection
- Return visitor detection via localStorage
- Clean contact forms and activity tracking

### **Integration:**
- Chat widget saves to HVAC tables
- Real-time contact list and activity timeline
- Demo/Live data toggle functional

## 🎯 IMMEDIATE PRIORITIES:

1. **Company Slug Filtering** - Add `?company=slug` support to `/hvac/contacts`
2. **Multi-Tenant Decision** - Choose companies vs tenants approach  
3. **Build `/hvac/messages`** - Live chat conversations page
4. **Clean up old files** - Remove dead-end `/pages/contacts/` etc.

## 🗂️ FILE STRUCTURE:
- `/pages/hvac/contacts.tsx` - Main contacts page (needs company filtering)
- `/scripts/seed-hvac-demo-data.js` - Demo data generator
- `/components/ChatWidget.tsx` - Professional chat widget
- `/pages/api/hvac/` - New HVAC API endpoints

**System is 90% complete - just needs company-specific filtering for MVP launch.**