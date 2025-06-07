# AtlasWebsites Pipeline System Analysis

## Overview
AtlasWebsites uses a comprehensive lead management pipeline system for HVAC contractors in Alabama and Arkansas. The system tracks businesses from initial contact through website creation and sale closure.

## Architecture

### Pipeline Stages
The system uses 8 distinct stages with clear progression logic:

1. **New Lead** (blue) - Ready to contact
2. **Voicemail Left** (indigo) - Left voicemail  
3. **Contacted** (green) - Initial contact made
4. **Website Viewed** (purple) - Engaged with site
5. **Appointment Scheduled** (orange) - Meeting set
6. **Follow-up** (yellow) - Needs follow-up
7. **Sale Closed** (emerald) - Deal won
8. **Not Interested** (gray) - Not a fit

### Pipeline Types
Companies are segmented into 4 distinct pipelines:
- `no_website_alabama` - Alabama companies without websites
- `no_website_arkansas` - Arkansas companies without websites  
- `has_website_alabama` - Alabama companies with existing websites
- `has_website_arkansas` - Arkansas companies with existing websites

## Key Files & Code

### 1. Main Pipeline Page (`pages/admin/pipeline.tsx`)

```typescript
interface PipelineLead {
  id: string;
  company_id: string;
  stage: string;
  last_contact_date?: string;
  next_follow_up_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
  company: Company;
}

const STAGES = [
  { key: 'new_lead', title: 'New Lead', color: 'bg-blue-500', textColor: 'text-white', description: 'Ready to contact' },
  { key: 'voicemail_left', title: 'Voicemail Left', color: 'bg-indigo-500', textColor: 'text-white', description: 'Left voicemail' },
  { key: 'contacted', title: 'Contacted', color: 'bg-green-500', textColor: 'text-white', description: 'Initial contact made' },
  { key: 'website_viewed', title: 'Website Viewed', color: 'bg-purple-500', textColor: 'text-white', description: 'Engaged with site' },
  { key: 'appointment_scheduled', title: 'Appointment Scheduled', color: 'bg-orange-500', textColor: 'text-white', description: 'Meeting set' },
  { key: 'follow_up', title: 'Follow-up', color: 'bg-yellow-500', textColor: 'text-white', description: 'Needs follow-up' },
  { key: 'sale_closed', title: 'Sale Closed', color: 'bg-emerald-600', textColor: 'text-white', description: 'Deal won' },
  { key: 'not_interested', title: 'Not Interested', color: 'bg-gray-500', textColor: 'text-white', description: 'Not a fit' }
];
```

**Key Features:**
- Kanban-style overview with stage cards showing lead counts
- Detailed stage view with searchable lead lists  
- Auto-refresh every 30 seconds for real-time updates
- Resizable sidebar for detailed lead management
- Pipeline type selector (Alabama/Arkansas, has website/no website)

### 2. Lead Sidebar Component (`components/admin/pipeline/LeadSidebar.tsx`)

**The sidebar is the core of the system with 5 main tabs:**

#### Overview Tab
- Business info cards (website status, logo status, reviews, rating)
- Review analytics (30/60/90/365 day review counts)
- Website visit tracking
- Contact information
- Quick action buttons (view reviews, preview website)

#### Notes Tab  
- Owner name input with auto-save
- Rich note editor with auto-save
- Initial contact checklist for new leads:
  - Meeting set checkbox
  - Website permission radio buttons (Yes/No/Hard No)
  - Scheduling software text input
- Auto-stage movement logic based on checklist
- Notes history with timestamps

#### SMS Tab
- Pre-filled SMS message with owner name and website URL
- Editable message template
- One-click SMS sending via device SMS app
- Auto-note creation when SMS sent

#### Analytics Tab
- Real-time website analytics
- Visitor session tracking
- Time on site metrics  
- Device type breakdown
- Referrer tracking
- "View Site" and "Refresh" buttons

#### Template Tab
- Live website customization
- Hero image, about image, and logo URL inputs
- Real-time preview iframe
- Domain management integration
- Link to business photos for customization

### 3. API Endpoints

#### Pipeline Leads API (`pages/api/pipeline/leads.ts`)
```typescript
// Fetches leads for specific pipeline type
// Returns: { leads, pipeline_type, pipeline_stats }

const { data: pipelineEntries } = await supabaseAdmin
  .from('lead_pipeline')
  .select('*')
  .eq('pipeline_type', selectedPipelineType)
  .order('updated_at', { ascending: false });
```

#### Move Lead API (`pages/api/pipeline/move-lead.ts`)
```typescript
// Handles stage transitions with automatic business logic
// Creates contact log entries
// Auto-enables tracking when moved to 'contacted'
// Sets follow-up dates for certain stages

if (stage === 'contacted') {
  await supabaseAdmin
    .from('companies')
    .update({ 
      tracking_enabled: true,
      tracking_paused: false
    })
    .eq('id', companyId);
}
```

#### Notes API (`pages/api/pipeline/notes.ts`)
```typescript
// Handles CRUD operations for lead notes
// Auto-creates pipeline entries for temp leads
// Determines pipeline type based on company state and website status

let pipelineType = '';
const hasWebsite = company.site && company.site.trim() !== '';
if (company.state === 'Alabama') {
  pipelineType = hasWebsite ? 'has_website_alabama' : 'no_website_alabama';
} else if (company.state === 'Arkansas') {
  pipelineType = hasWebsite ? 'has_website_arkansas' : 'no_website_arkansas';
}
```

### 4. Database Operations (`lib/supabase-db.ts`)

```typescript
// Core company operations
export async function getCompanyBySlug(slug: string): Promise<Company | null>
export async function getCompanyById(id: string): Promise<Company | null>  
export async function getAllCompanies(limit: number = 100): Promise<Company[]>
export async function updateCompany(id: string, updates: Partial<Company>): Promise<Company | null>

// Template frame management
export async function getCompanyFrames(companyId: string): Promise<CompanyFrame[]>
export async function setCompanyFrame(companyId: string, slug: string, url: string): Promise<CompanyFrame | null>
export async function getImageUrl(companyId: string, frameSlug: string, templateKey: string): Promise<string>
```

## Business Logic & Automation

### Auto-Stage Movement
The system includes intelligent auto-stage movement based on user actions:

1. **Website Viewed**: Analytics system auto-moves from 'contacted' to 'website_viewed' when first website visit detected
2. **Meeting Set**: Sidebar checklist auto-moves to 'appointment_scheduled' when meeting checkbox checked
3. **Hard No**: Auto-moves to 'not_interested' when "Hard No" selected for website permission
4. **Initial Contact**: Auto-moves from 'new_lead' to 'contacted' when website permission provided

### Analytics Integration
- Real-time website visit tracking via `template_views` table
- Session-based analytics with time tracking
- Device and referrer detection
- Auto-refresh analytics in sidebar

### Template Customization
- Company-specific image overrides via `company_frames` table
- Live preview with iframe
- Integration with photo analysis system
- Automatic image processing pipeline

## Database Tables Used

### Primary Tables
- `companies` - Business information and metadata
- `lead_pipeline` - Pipeline entries with stage tracking
- `lead_notes` - Notes and communication history
- `contact_log` - Stage change audit trail

### Supporting Tables  
- `template_views` - Website analytics and visit tracking
- `company_frames` - Custom images and template overrides
- `frames` - Default template frame definitions
- `business_photos` - Photo analysis and storage

## Key Features

### Search & Filtering
- Cross-stage search by business name, city, phone
- Pipeline type filtering (Alabama/Arkansas, website status)
- Real-time search with instant results

### Contact Management
- Integrated SMS sending with templates
- Email composition with pre-filled templates
- Phone number click-to-call
- Owner name tracking and auto-population

### Analytics Dashboard
- Website visit tracking per business
- Session duration and engagement metrics
- Device type analytics
- Referrer source tracking

### Template Management
- Live website preview
- Custom image uploads and management
- Domain configuration and verification
- Photo analysis integration

## System Flow

1. **Lead Import**: Companies imported from external sources into pipeline
2. **Initial Contact**: Sales team contacts leads, updates notes and checklist
3. **Website Creation**: Custom websites generated using ModernTrust template
4. **Analytics Tracking**: Website visits tracked and displayed in sidebar
5. **Follow-up Management**: Automated follow-up scheduling and reminders
6. **Sale Closure**: Final stage tracking and success metrics

This pipeline system provides a complete CRM solution specifically designed for HVAC contractor lead management, with integrated website creation, analytics, and communication tools.