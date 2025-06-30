# Business Expansion & GoHighLevel Transition

## 🎯 What We're Building

### **Core Business Model:**
Lead generation and website services for service-based businesses, starting with HVAC contractors and expanding to other niches (plumbing, electrical, landscaping, etc.).

### **Revenue Streams:**
1. **Website Creation Services** - Custom websites for businesses without online presence
2. **Lead Generation** - Targeted prospecting using personalized video outreach  
3. **CRM/Automation Services** - GoHighLevel setup and management for clients
4. **Multi-Niche Expansion** - Replicate successful HVAC model across other trades

---

## 🔄 Current State & Transition

### **Legacy System (Outdated):**
- Custom-built Next.js application with Supabase backend
- Basic SMS integration via TextGrid API
- Manual pipeline management
- Limited to HVAC prospects only
- Hardcoded video mappings and company data

### **New System (In Progress):**
- **GoHighLevel** as primary CRM and automation platform
- **Repliq** for personalized video creation at scale
- **TextGrid** integrated through GHL for SMS campaigns
- **Webhook-based automation** for real-time pipeline updates
- **Multi-niche expansion** capability

---

## 📊 Current Implementation Status

### ✅ **Completed:**
- Arkansas HVAC test companies setup (3 companies)
- Personalized video landing pages with Repliq integration
- Basic GoHighLevel webhook automation (video clicked → pipeline update)
- CSV import process for prospect data
- Red/blue/white UI theme alignment

### ⚠️ **In Progress:**
- Proper automation flow (page visited vs video watched)
- Multiple webhook triggers for different user actions
- Button interaction tracking and pipeline stage updates
- TextGrid integration through GoHighLevel

### ❌ **Not Started:**
- Multi-niche expansion (plumber, electrician templates)
- Automated lead qualification scoring
- Follow-up sequence automation
- Client dashboard for managing multiple campaigns
- Revenue tracking and analytics

---

## 🏗️ Technical Architecture

### **Frontend:**
- Next.js video intro pages (transitioning to GHL-hosted pages)
- React components for video display and interaction tracking
- Responsive design for mobile-first prospect experience

### **Backend:**
- Supabase for company/prospect data storage (legacy)
- GoHighLevel as primary CRM and automation engine (new)
- Webhook endpoints for real-time pipeline updates

### **Integrations:**
- **Repliq API** - Personalized video generation
- **TextGrid** - SMS delivery through GHL
- **GoHighLevel Webhooks** - Automation triggers

---

## 📈 Business Expansion Strategy

### **Phase 1: HVAC Mastery (Current)**
- Perfect Arkansas HVAC automation flow
- Achieve consistent lead-to-customer conversion
- Document repeatable processes

### **Phase 2: Niche Expansion (Next 30 days)**
- Replicate system for plumbers
- Create electrician prospect lists
- Develop niche-specific messaging templates

### **Phase 3: Scale & Systematize (60-90 days)**
- White-label GoHighLevel for clients
- Automated prospect research and list building
- Revenue-sharing partnerships with contractors

### **Phase 4: Market Domination (6 months)**
- Multi-state expansion
- Team building for account management
- SaaS productization of the system

---

## 🔧 Technical Debt & Cleanup Needed

### **Priority 1: Consolidation**
- Migrate all prospect data from Supabase to GoHighLevel
- Deprecate custom CRM functionality
- Standardize all automations through GHL

### **Priority 2: Code Quality**
- Remove hardcoded company mappings
- Implement dynamic video assignment system
- Create reusable components for multi-niche support

### **Priority 3: Scalability**
- Database optimization for larger prospect volumes
- API rate limiting and error handling
- Load balancing for high-traffic periods

---

## 🔧 Current GoHighLevel Setup

### **Pipeline Stages:**
1. **New Lead** - Imported from CSV
2. **Video Sent** - SMS sent manually
3. **Page Visited** - Clicked SMS link (auto-tracked)
4. **Video Watched** - Clicked play button (auto-tracked)  
5. **Action Taken** - Clicked any action button (auto-tracked)
6. **Call Attempted** - Manual update
7. **Call Connected** - Manual update
8. **Closed Won/Lost** - Manual update

### **Custom Fields:**
- `video_intro_url` (Text) - Personalized video page URL
- `repliq_video_creator` (Text) - Video creator name (Jared Thompson)
- `business_niche` (Text) - Industry type (HVAC)
- `buttons_clicked` (Text) - Tracks which buttons clicked
- `last_activity` (Text) - Most recent action taken
- `last_activity_time` (DateTime) - Timestamp of last activity

### **Pipeline Settings:**
- **Duplicate Opportunities**: Disabled (one opportunity per contact)
- **Stage Movement**: Enabled (allows forward/backward movement)
- **Auto-Progression**: Via webhook automations

### **Webhook Automations:**
1. **Page Visited**: Moves New Lead → Page Visited
2. **Video Watched**: Moves Page Visited → Video Watched  
3. **Action Taken**: Moves Video Watched → Action Taken (in progress)

---

## 💡 Key Success Metrics

### **Operational KPIs:**
- SMS delivery rate (target: >95%)
- Video view rate (target: >40%)
- Pipeline conversion rate (target: >15%)
- Cost per qualified lead (target: <$25)

### **Business KPIs:**
- Monthly recurring revenue growth
- Customer acquisition cost vs lifetime value
- Market expansion rate (new niches/locations)
- Client retention and satisfaction scores

---

## 🎯 Next Steps

1. **Complete GoHighLevel automation setup** (3 webhook triggers)
2. **Test end-to-end funnel** with Arkansas HVAC prospects
3. **Document standard operating procedures** for replication
4. **Begin plumber niche research** and prospect list building
5. **Develop client onboarding process** for white-label services

---

*Last Updated: June 29, 2025*  
*Status: Active Development - GoHighLevel Integration Phase*