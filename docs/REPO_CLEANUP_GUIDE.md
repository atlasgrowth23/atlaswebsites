# Repository Cleanup Guide

## Overview

This guide documents the cleanup of old HVAC infrastructure that has been replaced by the AtlasHVAC system, preparing the repository for multiple company types and clean architecture.

## Current Architecture

### ✅ Good Structure (Keep)

#### `/pages/admin/` - Global Admin Dashboard
- `calendar.tsx` - Calendar management
- `contacts.tsx` - Global contact management  
- `login.tsx` - Admin authentication
- `pipeline.tsx` - Sales pipeline management
- `tasks.tsx` - Task management
- `templates.tsx` - Template management

#### `/pages/atlashvac/` - AtlasHVAC CRM System
- `[company]/contacts.tsx` - Modern HVAC customer management
- `login.tsx` - AtlasHVAC authentication

**Database Tables:**
- `atlashvac_contacts` - Customer contacts (uses `tenant_id`)
- `atlashvac_equipment` - Equipment management with full specs
- `atlashvac_equipment_photos` - Equipment photo management
- `atlashvac_service_notes` - Service history

#### `/components/` - Reusable Components
- `AdminLayout.tsx` - Admin dashboard layout
- `UnifiedAdminLayout.tsx` - Unified admin interface
- `templates/ModernTrust/` - Website template components
- `tenant/` - Multi-tenant components

### ❌ Old Structure (To Remove)

#### `/pages/hvac/` - Legacy HVAC System
- `[company]/contacts.tsx` - Basic contact list (replaced by AtlasHVAC)
- `[company]/dashboard.tsx` - Simple dashboard (replaced by AtlasHVAC)
- `[company]/messages.tsx` - Basic messaging (messaging not yet in AtlasHVAC)
- `login.tsx` - Legacy login (replaced by AtlasHVAC login)

**Database Tables (Old):**
- `hvac_contacts` - Basic contacts (uses `company_id`)
- `hvac_equipment` - Basic equipment tracking
- `hvac_conversations` - Simple messaging
- `hvac_messages` - Message storage
- `hvac_contact_activities` - Basic activity log

#### Legacy API Routes
- `/pages/api/hvac/create-contact.ts` - Creates in old `hvac_contacts` table
- `/pages/api/hvac/send-message.ts` - Creates in old messaging tables

## Cleanup Process

### Phase 1: Pre-Cleanup Requirements

Before running cleanup scripts, you MUST:

1. **Update ChatWidget Integration**
   ```typescript
   // In components/ChatWidget.tsx
   // Change from:
   localStorage.getItem(`hvac_contact_${companyId}`)
   fetch('/api/hvac/send-message', ...)
   
   // To:
   localStorage.getItem(`atlashvac_contact_${companyId}`)
   fetch('/api/atlashvac/send-message', ...)
   ```

2. **Update Website Template Links**
   ```typescript
   // In components/templates/ModernTrust/Hero.tsx
   // Change from:
   href={`/hvac/login?company=${company.slug}&auto=true`}
   
   // To:
   href={`/atlashvac/login?company=${company.slug}&auto=true`}
   ```

3. **Create Missing AtlasHVAC API Endpoints**
   - `/pages/api/atlashvac/create-contact.ts`
   - `/pages/api/atlashvac/send-message.ts`

### Phase 2: File Cleanup

Run the file cleanup script:

```bash
node scripts/cleanup-old-hvac-system.js
```

This removes:
- Old HVAC pages (`/pages/hvac/`)
- Old HVAC API routes (`/pages/api/hvac/`)
- Legacy migration/cleanup scripts
- One-time setup scripts

### Phase 3: Database Cleanup

Analyze and clean database tables:

```bash
# First analyze what will be removed
node scripts/cleanup-old-hvac-database.js

# This will:
# 1. Show current table status
# 2. Check for data in old tables
# 3. Safely remove empty old tables
# 4. Skip tables with data (for manual review)
```

### Phase 4: Test System

After cleanup:
1. Test AtlasHVAC contact creation
2. Test equipment management 
3. Test chat widget functionality
4. Verify website template integration

## Future Architecture for Multiple Company Types

### Recommended Structure

```
/pages/
├── admin/                    # Global admin dashboard
├── [companyType]/           # Dynamic company type routing
│   ├── [company]/
│   │   ├── contacts.tsx     # Company-specific contacts
│   │   ├── dashboard.tsx    # Company-specific dashboard  
│   │   └── ...
│   └── login.tsx            # Company type login
└── api/
    ├── [companyType]/       # Company type specific APIs
    │   ├── create-contact.ts
    │   └── ...
    └── admin/               # Global admin APIs
```

### Database Schema Pattern

```sql
-- Pattern for each company type
CREATE TABLE {companytype}_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,           -- Company isolation
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  -- Company type specific fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS for tenant isolation
ALTER TABLE {companytype}_contacts ENABLE ROW LEVEL SECURITY;
```

### Component Structure

```
/components/
├── AdminLayout.tsx          # Global admin
├── [CompanyType]Layout.tsx  # Company type specific layouts
├── shared/                  # Shared components
│   ├── ContactList.tsx
│   ├── Dashboard.tsx
│   └── ...
└── templates/               # Website templates
    ├── ModernTrust/
    └── ...
```

## Benefits After Cleanup

1. **Clean Architecture**: Clear separation between admin and company-specific functionality
2. **Scalable**: Easy to add new company types (plumbing, electrical, etc.)
3. **Maintainable**: Removed redundant code and database tables
4. **Modern UX**: AtlasHVAC provides better user experience than old HVAC system
5. **Multi-tenant**: Proper tenant isolation with `tenant_id` pattern

## Migration Notes

- **Data Migration**: If old HVAC tables contain important data, migrate to AtlasHVAC tables before cleanup
- **Messaging System**: Old HVAC had messaging; AtlasHVAC doesn't yet - may need to implement
- **Activity Tracking**: Old system had basic activity logs - may need to port to AtlasHVAC
- **Dashboard Features**: Some dashboard features from old system may need to be ported

## Next Steps

1. Complete the cleanup process above
2. Implement dynamic `[companyType]` routing for future expansion
3. Add new company types (plumbing, electrical, landscaping, etc.)
4. Create shared component library for common CRM functionality
5. Implement company type specific features as needed