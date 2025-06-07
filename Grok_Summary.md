# AtlasWebsites Project Summary

## Project Description

**atlaswebsites** is a comprehensive HVAC contractor management platform that provides:
- Web platform for generating client websites with custom templates
- CRM system for managing leads and pipeline stages  
- Analytics dashboard for tracking website views and user engagement
- Template editor for customizing company branding and content
- Domain management and tracking capabilities

**Tech Stack:**
- **Frontend:** React with Next.js (TypeScript)
- **Backend:** Node.js/TypeScript with Next.js API routes
- **Database:** Supabase (PostgreSQL, Free Plan)
- **ORM:** Direct SQL queries via `pg` client and Supabase client
- **Styling:** TailwindCSS with Radix UI components
- **Image Processing:** Sharp for logo/image optimization

## File Structure

```
atlaswebsites/
├── components/           # React UI components
│   ├── AdminLayout.tsx   # Admin dashboard layout
│   ├── DomainManagement.tsx  # Custom domain settings
│   └── ErrorBoundary.tsx # Error handling wrapper
├── lib/                  # Core utilities and database
│   ├── supabase.ts      # Supabase client configuration
│   ├── db.ts            # PostgreSQL connection pool
│   ├── auth.ts          # Authentication logic
│   ├── cache.ts         # In-memory caching system
│   ├── images.ts        # Image processing utilities
│   └── photo.ts         # Photo URL generation
├── pages/               # Next.js pages and routing
│   ├── api/             # API endpoints
│   │   ├── auth/        # Authentication endpoints
│   │   ├── pipeline/    # Lead management API
│   │   └── analytics/   # Analytics tracking API
│   ├── admin/           # Admin dashboard pages
│   │   ├── login.tsx    # Admin login page
│   │   ├── pipeline.tsx # Lead pipeline management
│   │   └── analytics.tsx # Analytics dashboard
│   ├── templates/       # Template rendering pages
│   ├── [slug].tsx       # Dynamic company pages
│   └── index.tsx        # Root page (redirects to admin)
├── scripts/             # Database management scripts
│   ├── add-indexes-working.js    # Database index creation
│   ├── create-tables-direct.js  # Table creation script
│   └── verify-supabase-tables.ts # Database verification
└── middleware.ts        # Next.js middleware for routing
```

## Key File Contents

### lib/supabase.ts
```typescript
import { createClient } from '@supabase/supabase-js'

// Client for frontend use
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Admin client for server-side operations
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export type Company = {
  id: string
  name: string
  slug: string
  phone?: string
  email_1?: string
  site?: string
  city?: string
  state?: string
  rating?: number
  reviews?: number
  logo?: string
  custom_domain?: string
  domain_verified?: boolean
  tracking_enabled?: boolean
  template_key?: string
  hours?: string
  emergency_service?: boolean
  created_at?: string
  updated_at?: string
}

export type CompanyFrame = {
  id: string
  company_id: string
  slug: string
  url: string
  created_at?: string
  updated_at?: string
}
```

### lib/db.ts
```typescript
import { Pool, PoolClient } from 'pg';

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

export async function query(text: string, params?: any[]): Promise<QueryResponse> {
  return retryQuery(async () => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.log('Slow query detected:', { text, duration });
    }
    
    return res;
  });
}
```

### scripts/add-indexes-working.js
```javascript
const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addDatabaseIndexes() {
  const client = await pool.connect();
  
  try {
    // Template views indexes
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_company_id 
      ON template_views(company_id);
    `);
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_session_id 
      ON template_views(session_id);
    `);
    
    // Companies indexes
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_slug 
      ON companies(slug);
    `);
    
    await client.query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_state 
      ON companies(state);
    `);
    
    console.log('✅ All database indexes added successfully!');
  } finally {
    client.release();
  }
}
```

### pages/api/create-tables.ts
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create companies table
    await supabaseAdmin.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          slug TEXT UNIQUE NOT NULL,
          phone TEXT,
          email_1 TEXT,
          site TEXT,
          city TEXT,
          state TEXT,
          rating DECIMAL,
          reviews INTEGER,
          logo TEXT,
          custom_domain TEXT,
          domain_verified BOOLEAN DEFAULT FALSE,
          tracking_enabled BOOLEAN DEFAULT FALSE,
          template_key TEXT,
          hours TEXT,
          emergency_service BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    // Create company_frames table
    await supabaseAdmin.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS company_frames (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          slug TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

## Database Schema

### Core Tables:

**companies** - Main business data (HVAC companies)
- `id` (UUID, Primary Key)
- `name` (TEXT, NOT NULL) - Company name
- `slug` (TEXT, UNIQUE, NOT NULL) - URL-friendly identifier
- `phone` (TEXT) - Contact phone
- `email_1` (TEXT) - Primary email
- `site` (TEXT) - Website URL
- `city` (TEXT) - Business city
- `state` (TEXT) - Business state
- `rating` (DECIMAL) - Review rating
- `reviews` (INTEGER) - Review count
- `logo` (TEXT) - Logo URL
- `custom_domain` (TEXT) - Custom domain name
- `domain_verified` (BOOLEAN) - Domain verification status
- `tracking_enabled` (BOOLEAN) - Analytics tracking enabled
- `template_key` (TEXT) - Selected template
- `hours` (TEXT) - Business hours
- `emergency_service` (BOOLEAN) - 24/7 service availability
- `created_at`, `updated_at` (TIMESTAMP)

**company_frames** - Custom images per company
- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key → companies.id)
- `slug` (TEXT) - Frame identifier (hero_img, logo_url, etc.)
- `url` (TEXT) - Image URL
- `created_at`, `updated_at` (TIMESTAMP)

**frames** - Default template images
- `id` (UUID, Primary Key)
- `slug` (TEXT) - Frame identifier
- `template_key` (TEXT) - Template name
- `default_url` (TEXT) - Default image URL
- `description` (TEXT) - Frame description
- `created_at`, `updated_at` (TIMESTAMP)

**template_views** - Analytics tracking
- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key → companies.id)
- `session_id` (TEXT) - User session identifier
- `template_key` (TEXT) - Template viewed
- `device_type` (TEXT) - Device category
- `created_at` (TIMESTAMP)

**pipeline_leads** - Lead management
- `id` (UUID, Primary Key)
- `company_id` (UUID, Foreign Key → companies.id)
- `stage` (TEXT) - Pipeline stage
- `notes` (TEXT) - Lead notes
- `owner_name` (TEXT) - Assigned owner
- `created_at`, `updated_at` (TIMESTAMP)

## How It Works

### Database Connection Strategy:
1. **Development/Production Queries**: Uses `DATABASE_URL` with `?pgbouncer=true` for connection pooling
2. **Direct Operations**: Uses `DIRECT_URL` for migrations and schema changes
3. **Custom DDL**: Uses `pg` client for complex database operations
4. **Supabase Client**: Used for standard CRUD operations

### Migration Workflow:
1. Scripts in `/scripts/` folder handle database schema changes
2. Migration scripts use `DIRECT_URL` for direct database access
3. Index creation uses `CONCURRENTLY` for zero-downtime updates
4. Verification scripts check table structure and data integrity

### Application Flow:
1. Root page (`/`) redirects to admin login or dashboard
2. Admin authentication manages user sessions
3. Pipeline management tracks leads through stages
4. Template system generates custom company websites
5. Analytics tracking captures user interactions
6. Domain management handles custom domain setup

### Key Integrations:
- **Supabase Storage**: For image/logo uploads
- **Edge Config**: For configuration management
- **Anthropic API**: For AI-powered features
- **Google Maps API**: For location services

## Environment Variables Required:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL (with ?pgbouncer=true)
DIRECT_URL (without pgbouncer)
ANTHROPIC_API_KEY
GOOGLE_MAPS_API_KEY
```

**Need clarification on:** Specific Prisma schema file location, exact pipeline stage definitions, and complete table relationships for leads/notes foreign keys.