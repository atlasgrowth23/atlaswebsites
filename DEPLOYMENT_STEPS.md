# HVAC Platform: Fixed Deployment Steps

## What We Fixed

1. **Fixed TypeScript Errors in Templates**:
   - Updated the ModernTrust Footer component to properly reference company properties
   - Changed `company.address` to `company.street || company.full_address`
   - Changed `company.zip` to `company.postal_code`
   - Changed `company.email` to `company.email_1`

2. **Custom Domain and Subdomain Support**:
   - Added NextJS middleware for domain handling
   - Created domain-handler API endpoint for routing
   - Updated config for cross-origin requests

3. **Template Selection**:
   - Added TemplateSelector component
   - Created update-template API endpoint

## Steps for Successful Deployment

1. **Prepare Your GitHub Repository**:
   - Push this code to your GitHub repository
   - Make sure all changes are committed

2. **Set Up Vercel Account**:
   - Go to [vercel.com](https://vercel.com) and sign up/log in
   - Connect your GitHub account

3. **Create a New Project in Vercel**:
   - Click "Add New" → "Project"
   - Select your repository from the list
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Add Environment Variables:
       - `DATABASE_URL`: (copy from Replit)
       - `PRIMARY_DOMAIN`: your main domain (e.g., yourhvacsite.com)
   - Click "Deploy"

4. **Wait for Deployment**:
   - Vercel will build and deploy your project
   - Once deployed, you'll see a success message and a live URL

5. **Set Up Custom Domains (if needed)**:
   - Go to "Settings" → "Domains"
   - Add your primary domain 
   - Add wildcard subdomain (*.yourdomain.com) if using subdomains
   - Add custom business domains individually

## Database Setup

1. **Ensure Database Access**:
   - Make sure your Vercel deployment can access your database
   - Consider migrating to a cloud PostgreSQL provider like Neon or Supabase if needed

2. **Run Migration Scripts**:
   - Make sure the database tables are created
   - Use the scripts in the `/scripts` directory

## Troubleshooting

If you encounter deployment issues:

1. **Check Build Logs**:
   - In Vercel, go to the deployment and check the build logs
   - Look for any TypeScript errors or build failures

2. **Database Connection**:
   - Verify that the DATABASE_URL is correct
   - Check network access between Vercel and your database

3. **Domain Setup**:
   - Ensure DNS records are properly configured
   - Allow time for DNS changes to propagate

4. **Run Type Checking Locally**:
   - Run `npm run build` locally to catch TypeScript errors before deploying

## Maintenance

- When updating the codebase, Vercel will automatically redeploy on GitHub pushes
- New business templates can be added to the TemplateSelector component
- Database schema changes should be accompanied by migration scripts