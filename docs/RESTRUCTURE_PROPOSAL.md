# Repository Restructure Proposal

## Current Issues

### 🗂️ Root Directory Clutter
```
├── AGENT_2_HANDOFF.md
├── CLAUDE_HVAC.md
├── NICK_HVAC_OVERVIEW.md
├── Arkansas HVAC Updated.csv
├── create-atlashvac-contacts.js
├── debug-tags.js
├── check_tasks_table.js
├── client_secret_*.json (2 files)
└── ... (lots of loose files)
```

### 📁 Scripts Directory Chaos
160+ scripts with no organization - analysis, cleanup, testing, migration scripts all mixed together.

### 🔧 API Structure Issues
```
/api/
├── hvac/ (old system)
├── chat/ (generic)
├── dashboard/ (generic)
├── admin/ (admin specific)
└── ... (mixed purposes)
```

### 📚 Library Organization
Company-specific logic mixed with generic utilities:
```
/lib/
├── atlashvac-equipment.ts (HVAC specific)
├── supabase-db.ts (generic)
├── auth.ts (generic)
└── ...
```

## 🎯 Proposed New Structure

### Root Directory
```
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── middleware.ts
├── .env.local
├── .gitignore
└── vercel.json
```

### Documentation & Assets
```
├── docs/
│   ├── setup/
│   │   ├── README.md
│   │   ├── database-setup.md
│   │   └── deployment.md
│   ├── company-types/
│   │   ├── hvac-implementation.md
│   │   └── adding-new-types.md
│   ├── voice-system/
│   │   ├── atlas-voice-guide.md
│   │   └── hey-atlas-voice.md
│   └── handoffs/
│       ├── agent-handoff-critical.md
│       └── session-notes/
├── assets/
│   ├── data/
│   │   ├── arkansas-hvac.csv
│   │   └── merged-reviews.json
│   ├── temp/
│   │   └── attached_assets/
│   └── credentials/
│       └── google-oauth-secrets.json
```

### Core Application
```
├── src/
│   ├── components/
│   │   ├── shared/
│   │   │   ├── ui/ (button, input, etc.)
│   │   │   ├── layout/
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   └── TenantLayout.tsx
│   │   │   ├── forms/
│   │   │   └── common/
│   │   ├── admin/
│   │   │   ├── calendar/
│   │   │   ├── pipeline/
│   │   │   └── dashboard/
│   │   ├── company-types/
│   │   │   ├── hvac/
│   │   │   │   ├── ContactManager.tsx
│   │   │   │   ├── EquipmentManager.tsx
│   │   │   │   └── ServiceHistory.tsx
│   │   │   └── plumbing/ (future)
│   │   ├── templates/
│   │   │   └── ModernTrust/
│   │   └── features/
│   │       ├── chat/
│   │       ├── voice/
│   │       └── analytics/
│   ├── lib/
│   │   ├── core/
│   │   │   ├── supabase.ts
│   │   │   ├── auth.ts
│   │   │   └── cache.ts
│   │   ├── company-types/
│   │   │   ├── hvac/
│   │   │   │   ├── equipment.ts
│   │   │   │   └── contacts.ts
│   │   │   └── shared/
│   │   │       ├── contacts.ts
│   │   │       └── activities.ts
│   │   ├── features/
│   │   │   ├── analytics/
│   │   │   ├── voice/
│   │   │   └── calendar/
│   │   └── utils/
│   │       ├── formatters.ts
│   │       ├── images.ts
│   │       └── validators.ts
│   └── types/
│       ├── shared.ts
│       ├── admin.ts
│       ├── company-types/
│       │   ├── hvac.ts
│       │   └── index.ts
│       └── api.ts
```

### Pages Structure
```
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── admin/
│   │   ├── index.tsx
│   │   ├── calendar.tsx
│   │   ├── pipeline.tsx
│   │   ├── contacts.tsx
│   │   └── templates.tsx
│   ├── company/
│   │   └── [companyType]/
│   │       ├── [slug]/
│   │       │   ├── index.tsx
│   │       │   ├── contacts.tsx
│   │       │   ├── dashboard.tsx
│   │       │   └── equipment.tsx
│   │       └── login.tsx
│   ├── templates/
│   │   └── [templateKey]/
│   │       └── [slug].tsx
│   └── api/
│       ├── admin/
│       │   ├── calendar/
│       │   ├── pipeline/
│       │   └── templates/
│       ├── company-types/
│       │   ├── hvac/
│       │   │   ├── contacts.ts
│       │   │   ├── equipment.ts
│       │   │   └── messages.ts
│       │   └── shared/
│       │       ├── auth.ts
│       │       └── analytics.ts
│       ├── templates/
│       │   ├── tracking.ts
│       │   └── customization.ts
│       └── webhooks/
│           ├── calendly.ts
│           ├── gohighlevel.ts
│           └── textgrid/
```

### Database & Infrastructure
```
├── database/
│   ├── migrations/
│   │   ├── core/
│   │   ├── company-types/
│   │   │   └── hvac/
│   │   └── admin/
│   ├── seeds/
│   │   ├── demo-data/
│   │   └── test-data/
│   └── schemas/
│       ├── company-types.sql
│       └── admin.sql
├── scripts/
│   ├── setup/
│   │   ├── initial-setup.js
│   │   └── create-company-type.js
│   ├── maintenance/
│   │   ├── cleanup-old-data.js
│   │   └── optimize-database.js
│   ├── migrations/
│   │   ├── run-migration.js
│   │   └── rollback-migration.js
│   ├── testing/
│   │   ├── test-*.js
│   │   └── stress-test-*.js
│   ├── analysis/
│   │   ├── analyze-*.js
│   │   └── check-*.js
│   └── company-types/
│       ├── hvac/
│       │   ├── seed-equipment.js
│       │   └── migrate-contacts.js
│       └── create-new-type.js
```

## 🔄 Migration Plan

### Phase 1: Organize Documentation & Assets
1. Create `docs/` and move all `.md` files
2. Create `assets/` and move CSV, JSON, images
3. Move OAuth secrets to `assets/credentials/`

### Phase 2: Restructure Source Code
1. Create `src/` directory
2. Reorganize components by purpose/scope
3. Reorganize lib by company-types and features
4. Move types to organized structure

### Phase 3: Reorganize Scripts
1. Categorize 160+ scripts by purpose
2. Archive old/unused scripts
3. Create organized script structure

### Phase 4: Update Pages & API
1. Implement dynamic company-type routing
2. Reorganize API endpoints by scope
3. Update imports throughout codebase

## 🎉 Benefits

### 📈 Scalability
- Easy to add new company types (plumbing, electrical, etc.)
- Clear separation of concerns
- Reusable components and utilities

### 🧹 Maintainability  
- No more digging through 160+ scripts
- Clear file organization
- Documentation in logical structure

### 👥 Developer Experience
- Easy to find relevant code
- Clear patterns for new features
- Organized by business logic

### 🚀 Future Ready
- Support multiple company types
- Modular architecture
- Easy to extract features to microservices

## Example: Adding "Plumbing" Company Type

With new structure:
```bash
# 1. Create types
touch src/types/company-types/plumbing.ts

# 2. Create components  
mkdir src/components/company-types/plumbing
touch src/components/company-types/plumbing/ContactManager.tsx

# 3. Create lib functions
mkdir src/lib/company-types/plumbing
touch src/lib/company-types/plumbing/equipment.ts

# 4. Create API routes
mkdir pages/api/company-types/plumbing
touch pages/api/company-types/plumbing/contacts.ts

# 5. Database migration
touch database/migrations/company-types/plumbing/001-create-tables.sql
```

URL structure would be:
- `yoursite.com/company/plumbing/acme-plumbing/contacts`
- `yoursite.com/company/plumbing/acme-plumbing/equipment`

Same pattern for electrical, landscaping, etc.!