# Atlas - Multi-Business Platform

A scalable platform for hosting professional websites for businesses and providing tenant SaaS functionality. Features admin CRM for lead management and tenant dashboard for customer management.

## Features

### Business Websites
- **Multi-tenant architecture**: Host unlimited business websites on one platform
- **Professional templates**: Modern, responsive website templates (ModernTrust, etc.)
- **Custom domain support**: Businesses can use custom domains or branded subdomains
- **SEO optimized**: Each site is optimized for search engines and social media sharing

### Admin CRM
- **Pipeline management**: Lead tracking with stages and activity logging
- **Analytics dashboard**: Visitor tracking and session analytics
- **Template management**: Control business website templates and customizations
- **Custom domain management**: Configure and verify domains for businesses

### Tenant Dashboard (Phase 1)
- **Contact management**: HVAC customer database with equipment tracking
- **Equipment details**: Model numbers, warranties, service history
- **Voice notes**: Web Speech API integration for field notes
- **Dark/light theme**: User preference toggle

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, and Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **UI Components**: Radix UI primitives with Tailwind
- **Database**: Supabase with RLS (Row Level Security)
- **Authentication**: Supabase Auth (future implementation)

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Supabase project with PostgreSQL database

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/atlasgrowth23/atlaswebsites.git
   cd atlaswebsites
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file with:
   ```bash
   DATABASE_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:5432/postgres
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   DEV_TENANT_ID=your_test_tenant_id
   ```

4. Run Phase 1 migrations
   ```bash
   node scripts/run-phase1-migrations.js
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Phase 1 Setup

Atlas is being built in phases. Phase 1 includes:

### Database Setup
```bash
# Run Phase 1 migrations (creates tenants and contacts tables)
node scripts/run-phase1-migrations.js
```

### Access Points
- **Admin CRM**: `http://localhost:3000/admin/pipeline`
- **Tenant Dashboard**: `http://localhost:3000/contacts` (after running migrations)
- **Dev Login**: `http://localhost:3000/login-dev` (auto-redirects to contacts)

### Test Data
The migration script creates a test tenant with sample contacts for development.

## Project Structure

- `/pages` - Next.js pages including:
  - `/pages/t/[template_key]/[slug].tsx` - Business website templates
  - `/pages/hvacportal` - Admin portal for businesses
  - `/pages/api` - API endpoints
  
- `/components` - Reusable React components
  - `/components/chat` - Chat widget components
  - `/components/portal` - Admin portal components
  
- `/lib` - Utility functions and database interactions
  - `/lib/db.js` - Database connection and query functions
  
- `/public` - Static assets (images, etc.)

- `/scripts` - Database and setup scripts

## Domains & Routing

The platform supports three ways to access business websites:

1. Direct URL: `/t/[template_key]/[slug]`
2. Subdomain: `business-name.yourdomain.com`
3. Custom domain: `businessdomain.com`

Routing is handled by Next.js middleware and the domain handler API.

### Custom Domain Management

Businesses can configure custom domains through the admin pipeline interface:
- Add custom domains via domain management modal
- Automatic Vercel domain configuration
- DNS setup instructions provided
- Domain verification status tracking

## Deployment

We've included a deployment preparation script to make deployment easier:

```bash
# Make the script executable
chmod +x prepare-deployment.sh

# Run the preparation script
./prepare-deployment.sh
```

This script:
1. Cleans up build artifacts
2. Removes unnecessary files that might cause build errors
3. Runs TypeScript checks
4. Tests the build process locally

For full deployment instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md).

## License

This project is licensed under the MIT License - see the LICENSE file for details.