# Managing Multi-Tenant Client Websites

This document outlines strategies for managing multiple client websites using the HVAC platform.

## Deployment Strategies

### Option 1: Single Deployment for All Clients

**Current Setup:** All client websites are served from a single Vercel deployment.

**Pros:**
- Simple to manage
- Single codebase
- Efficient use of resources

**Cons:**
- Changes affect all clients simultaneously
- Harder to test changes for just one client
- Single point of failure

### Option 2: Separate Deployments Per Client (Recommended)

Instead of using one deployment for all clients, create separate Vercel projects for each client:

1. **Main Repository (Development):**
   - Keep as your main development environment
   - Test new features here
   - Use for onboarding new clients

2. **Client-Specific Repositories:**
   - Create a separate repository for each major client
   - Fork from the main repository
   - Deploy to a separate Vercel project
   - Update only when client approves changes

## Implementation Steps for Option 2

### Step 1: Set Up Client-Specific Repository

1. Create a new GitHub repository for the client (e.g., `hvac-platform-clientname`)
2. Clone your main repository
3. Change the remote URL to point to the new client repository
4. Push to the new repository

```bash
# Clone the main repo
git clone https://github.com/yourusername/hvac-platform.git hvac-platform-clientname
cd hvac-platform-clientname

# Remove the old remote and add the new one
git remote remove origin
git remote add origin https://github.com/yourusername/hvac-platform-clientname.git

# Push to the new repository
git push -u origin main
```

### Step 2: Configure Client-Specific Environment

1. Create a new project in Vercel connected to the client repository
2. Set up environment variables specific to this client:
   ```
   DATABASE_URL=postgresql://username:password@hostname:port/client_database
   PRIMARY_DOMAIN=clientdomain.com
   ```
3. Configure custom domains in Vercel settings

### Step 3: Manage Database

You have two options for database management:

1. **Separate Database Per Client (Most Secure)**
   - Create a new PostgreSQL database for each client
   - Update the DATABASE_URL in the client's Vercel project

2. **Shared Database with Separate Tables**
   - Use schema prefixes or table name prefixes to separate client data
   - Example: `client1_companies`, `client2_companies`

### Step 4: Update Process

When you want to push updates to a client site:

1. Develop and test on your main repository
2. Once features are stable:
   ```bash
   # In the client repo directory
   git pull origin main    # Pull from your main repository
   # Resolve any conflicts
   git push                # Push to client repository
   ```
3. Vercel will automatically deploy the changes

## Managing Feature Flags

For advanced control, add feature flags to enable/disable features for specific clients.

1. Create a `features` table in your database:
   ```sql
   CREATE TABLE features (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     enabled BOOLEAN DEFAULT false,
     client_id INTEGER REFERENCES clients(id)
   );
   ```

2. Add a utility function to check feature flags:
   ```typescript
   // lib/features.ts
   export async function isFeatureEnabled(featureName: string, clientId: number) {
     const result = await query(
       'SELECT enabled FROM features WHERE name = $1 AND client_id = $2',
       [featureName, clientId]
     );
     return result.rows.length > 0 ? result.rows[0].enabled : false;
   }
   ```

3. Use in your code:
   ```typescript
   if (await isFeatureEnabled('new_dashboard', client.id)) {
     // Show new dashboard
   } else {
     // Show old dashboard
   }
   ```

## Emergency Rollback Plan

If a deployment causes issues for a client:

1. Go to the client's project in Vercel
2. Navigate to "Deployments"
3. Find the last known good deployment
4. Click "..." and select "Promote to Production"

This will immediately roll back to the previous version without requiring code changes.