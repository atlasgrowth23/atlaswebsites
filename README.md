# HVAC Business Management Platform

A comprehensive platform for HVAC contractors to manage their business website, customer contacts, and messaging.

## Features

- **Multi-tenant architecture**: Host multiple HVAC business websites odn one platform
- **Template-based websites**: Each business uses a professional template 
- **Custom domain support**: Businesses can use custom domains or subdomains
- **Customer messaging system**: Built-in chat widget that connects to the admin portal
- **Contact management**: Store and manage customer contacts
- **Real-time notifications**: Get notified of new messages immediately

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, and Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL database
- **Deployment**: Vercel (with instructions for setup)

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- PostgreSQL database (can use Replit database or external)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/hvac-platform.git
   cd hvac-platform
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file with:
   ```
   DATABASE_URL=your_postgresql_connection_string
   PRIMARY_DOMAIN=yourdomain.com
   ```

4. Run database setup
   ```
   npx tsx scripts/create-hvac-tables.ts
   npx tsx scripts/create-message-tables.ts
   ```

5. Start the development server
   ```
   npm run dev
   ```

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