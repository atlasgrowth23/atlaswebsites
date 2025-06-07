# AtlasWebsites Project - Modern Trust Template Deep Dive

## Template Overview: Modern Trust Structure

**Modern Trust** is a comprehensive HVAC business template with the following sections:

### Template Sections:
1. **Header** - Navigation with logo and contact info
2. **Hero Section** - Main banner with company name, tagline, and CTA
3. **About Section** - Company description with team photo
4. **Services Section** - Service offerings with icons/descriptions
5. **Reviews Section** - Customer testimonials and ratings
6. **Service Area Section** - Geographic coverage map/list
7. **Footer** - Contact details, hours, emergency service info

### Rendering System:
Templates are rendered dynamically at `/t/{template_key}/{company_slug}` where:
- `template_key` = "moderntrust" 
- `company_slug` = unique business identifier
- Data is fetched from `companies` table and merged with template structure

## Customization System

### Template Editor Interface:
Located at `/template-editor` - allows real-time customization of:

**Text Customizations:**
- Company name and tagline
- Service descriptions
- About section content
- Contact information

**Image Customizations:**
- Logo upload/replacement
- Hero background images
- About section photos
- Service icons

### How Customization Works:

```typescript
// From pages/template-editor.tsx
const saveCustomizations = async (company: CompanyWithTracking) => {
  const customizations = [];
  
  // Text customizations
  if (company.customName !== company.name) {
    customizations.push({
      customization_type: 'company_name',
      custom_value: company.customName,
      original_value: company.name
    });
  }
  
  // Image customizations  
  if (company.customHeroImg) {
    customizations.push({
      customization_type: 'hero_img',
      custom_value: company.customHeroImg
    });
  }
  
  // Save to database
  await fetch('/api/template-customizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId: company.id,
      customizations
    })
  });
};
```

### Database Storage:
Customizations are stored in `template_customizations` table:
```sql
CREATE TABLE template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  customization_type TEXT NOT NULL,
  custom_value TEXT NOT NULL,
  original_value TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Image Handling: Frames & Company Frames System

### Two-Tier Image System:

**1. Default Frames** (`frames` table):
```sql
CREATE TABLE frames (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL,           -- 'hero_img', 'logo_url', 'about_img'
  template_key TEXT NOT NULL,   -- 'moderntrust'
  default_url TEXT NOT NULL,    -- Default image URL
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**2. Company-Specific Frames** (`company_frames` table):
```sql
CREATE TABLE company_frames (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  slug TEXT NOT NULL,           -- 'hero_img', 'logo_url', 'about_img'  
  url TEXT NOT NULL,            -- Custom image URL
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Image Resolution Logic:
```typescript
// From lib/photo.ts
export function getPhotoUrl(company: any, frameName: string, templateKey: string): string | null {
  // 1. Check for company-specific custom image
  if (company.company_frames?.[frameName]) {
    return company.company_frames[frameName];
  }
  
  // 2. Check for uploaded image in storage
  if (company.logo_storage_path && frameName === 'logo_url') {
    return `https://supabase.co/storage/v1/object/public/logos/${company.logo_storage_path}`;
  }
  
  // 3. Fall back to default frame for template
  const defaultFrame = getDefaultFrame(frameName, templateKey);
  return defaultFrame?.default_url || null;
}
```

## Routing & Domain System

### Middleware-Based Domain Routing:
```typescript
// From middleware.ts
export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host');
  
  // Skip API routes and static files
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return NextResponse.next();
  }
  
  // Handle custom domains
  if (hostname && !hostname.includes('localhost') && !hostname.includes('replit')) {
    // Direct Supabase lookup for custom domain
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: company } = await supabase
      .from('companies')
      .select('slug, template_key')
      .eq('custom_domain', hostname)
      .eq('domain_verified', true)
      .single();
    
    if (company) {
      // Rewrite to template page
      const templateKey = company.template_key || 'moderntrust';
      return NextResponse.rewrite(
        new URL(`/t/${templateKey}/${company.slug}`, request.url)
      );
    }
  }
  
  return NextResponse.next();
}
```

### Connect Domain Feature:
```typescript
// From components/DomainManagement.tsx
const handleDomainUpdate = async () => {
  const response = await fetch('/api/manage-domain', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      companyId: company.id,
      domain: customDomain,
      action: 'connect'
    })
  });
  
  if (response.ok) {
    // Domain verification process initiated
    setDomainStatus('pending_verification');
  }
};
```

## Key Code Components

### Template Rendering API:
```typescript
// From pages/api/template-views.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { company_id, template_key, session_id, device_type } = req.body;
  
  // Track template view for analytics
  await supabaseAdmin
    .from('template_views')
    .insert({
      company_id,
      template_key,
      session_id,
      device_type,
      created_at: new Date().toISOString()
    });
    
  res.status(200).json({ success: true });
}
```

### Company Data API:
```typescript
// From pages/api/get-company-by-domain.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { domain } = req.query;
  
  const { data: company, error } = await supabaseAdmin
    .from('companies')
    .select(`
      *,
      company_frames (slug, url)
    `)
    .eq('custom_domain', domain)
    .eq('domain_verified', true)
    .single();
    
  if (error || !company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  
  res.status(200).json(company);
}
```

## Database Schema Summary

### Core Tables:

**companies** - Business information
- Basic details (name, slug, contact info)
- Domain settings (custom_domain, domain_verified)
- Template selection (template_key)
- Tracking settings (tracking_enabled)

**company_frames** - Custom business images
- Links to companies via company_id
- Stores custom images per frame type (hero, logo, about)

**frames** - Default template images
- Template-specific default images
- Fallback when no custom image set

**template_views** - Analytics tracking
- Page view tracking per company/template
- Device and session information

**template_customizations** - Text/content customizations
- Stores custom text overrides
- Links customization type to custom values

**pipeline_leads** - Lead management
- Business lead tracking through pipeline stages
- Notes and owner assignment

## System Assessment

### Strengths:
1. **Flexible Template System** - Easy to add new templates
2. **Custom Domain Support** - Professional business presence
3. **Image Management** - Fallback system ensures no broken images
4. **Analytics Tracking** - Detailed view tracking and analytics
5. **Lead Pipeline** - Built-in CRM for lead management
6. **Real-time Customization** - Live preview of changes

### Current Limitations:
1. **Single Page Sites** - Only one-page templates currently
2. **Limited Template Variety** - Only 2 templates (boldenergy, moderntrust)
3. **Basic Customization** - Limited to text and image swaps
4. **No Advanced Features** - Missing financing, scheduling, etc.

### Enhancement Opportunities:

**1. Financing Section Addition:**
```sql
-- New table for financing options
CREATE TABLE financing_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  provider TEXT NOT NULL,       -- 'synchrony', 'greensky', etc.
  terms TEXT,                   -- '0% for 12 months'
  min_amount DECIMAL,
  max_amount DECIMAL,
  enabled BOOLEAN DEFAULT TRUE
);
```

**2. Multi-Page Site Structure:**
```sql
-- New table for additional pages
CREATE TABLE company_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  slug TEXT NOT NULL,           -- 'about', 'services', 'contact'
  title TEXT NOT NULL,
  content TEXT,
  template_section TEXT,        -- Which template section to use
  order_index INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT TRUE
);
```

**3. Custom Chat Widget:**
```sql
-- Chat widget configuration
CREATE TABLE chat_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  widget_type TEXT DEFAULT 'basic',     -- 'basic', 'ai_powered'
  greeting_message TEXT,
  business_hours TEXT,
  offline_message TEXT,
  enabled BOOLEAN DEFAULT TRUE
);
```

**4. Contact Management System:**
```sql
-- Enhanced contact tracking
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT,                  -- 'website', 'chat', 'phone'
  status TEXT DEFAULT 'new',    -- 'new', 'contacted', 'quoted', 'won', 'lost'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Implementation Roadmap:
1. Add financing section to Modern Trust template
2. Implement multi-page routing system
3. Build chat widget component with business hours logic
4. Create contact management interface
5. Add template sections for scheduling and service areas
6. Implement advanced customization options (colors, fonts, layouts)

The system is well-architected for these enhancements with clear separation between templates, customizations, and business data.