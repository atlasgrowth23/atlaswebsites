# Deploying to Vercel

This guide provides step-by-step instructions for deploying the HVAC Business Platform to Vercel.

## Prerequisites

- A GitHub account with this repository pushed to it
- A Vercel account (can sign up at [vercel.com](https://vercel.com))
- Access to your PostgreSQL database credentials

## Step 1: Prepare Your Repository

1. Make sure all your changes are committed and pushed to GitHub
2. Ensure the code is free of TypeScript errors by running:
   ```
   npm run build
   ```
3. Fix any errors that appear during the build process

## Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up or log in
2. Connect your GitHub account if you haven't already

## Step 3: Create a New Project

1. From the Vercel dashboard, click "Add New" → "Project"
2. Select your repository from the list
3. Configure the project with the following settings:

   ![Project Configuration](https://i.imgur.com/example-config.png)

   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `next build` (default)
   - **Install Command**: `npm install` (default)
   - **Output Directory**: `.next` (default)

## Step 4: Environment Variables

Add the following environment variables:

- `DATABASE_URL`: Your PostgreSQL connection string
  ```
  postgresql://username:password@hostname:port/database
  ```

- `PRIMARY_DOMAIN`: Your main domain (e.g., `hvacbusiness.com`)
  ```
  hvacbusiness.com
  ```

- `REVALIDATE_SECRET`: A random string for secure revalidation
  ```
  your-random-secret-string
  ```

![Environment Variables](https://i.imgur.com/example-env-vars.png)

## Step 5: Deploy

1. Click "Deploy"
2. Wait for the build and deployment to complete
3. Once deployed, Vercel will provide you with a URL (e.g., `your-project.vercel.app`)

## Step 6: Configure Custom Domains

To set up custom domains:

1. Go to your project settings in the Vercel dashboard
2. Click on "Domains"
3. Add your primary domain:
   - Enter your domain name (e.g., `hvacbusiness.com`)
   - Follow the instructions to configure DNS records

4. For wildcard subdomains (if using business.yourdomain.com format):
   - Add `*.yourdomain.com` as a domain
   - Set up the DNS records as instructed by Vercel

5. For business-specific custom domains:
   - Add each domain individually
   - Configure DNS as instructed

![Domain Configuration](https://i.imgur.com/example-domain-config.png)

## Step 7: Test Your Deployment

After deployment, test the following:

1. The main website landing page
2. Business-specific pages:
   - Via direct URL: `/t/[template_key]/[slug]`
   - Via subdomain (if configured): `business.yourdomain.com`
   - Via custom domain (if configured): `businessdomain.com`
3. The business portal login and functionality
4. The chat widget on business pages

## Updating Your Deployment

When you push changes to your GitHub repository, Vercel will automatically redeploy your project.

### Manual Redeployment

If you need to redeploy manually:

1. Go to your project in the Vercel dashboard
2. Click "Deployments"
3. Click "Redeploy" on the deployment you want to rebuild

### Rollbacks

If a deployment causes issues:

1. Go to your project's "Deployments" tab
2. Find a previous working deployment
3. Click the three dots (⋮) and select "Promote to Production"

## Monitoring and Logs

To view logs and monitor your deployment:

1. Go to your project in the Vercel dashboard
2. Click "Deployments" then select a specific deployment
3. Click "Functions" to see serverless function logs
4. Click "Runtime Logs" to see application logs

## Troubleshooting

### Database Connection Issues

If your app cannot connect to the database:

1. Verify the `DATABASE_URL` environment variable
2. Check if your database allows connections from Vercel's IP ranges
3. Test the connection locally with the same URL

### Build Failures

If your build fails:

1. Check the build logs for specific errors
2. Fix TypeScript errors or other issues in your code
3. Redeploy after making changes

### Domain Configuration

If domain connections aren't working:

1. Verify DNS records are set up correctly
2. Check the domain settings in Vercel dashboard
3. Allow time for DNS propagation (up to 48 hours)

## Need Help?

If you continue to have deployment issues:

- Check [Vercel Documentation](https://vercel.com/docs)
- Visit [Vercel Support](https://vercel.com/support)
- Consult community forums like [Stack Overflow](https://stackoverflow.com/questions/tagged/vercel)