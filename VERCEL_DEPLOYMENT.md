# Vercel Deployment Guide for HVAC Website

This guide will help you deploy your Next.js HVAC management platform to Vercel and set up domain handling properly.

## Prerequisites

Before deploying to Vercel, make sure you have:

1. A Vercel account
2. Access to your database connection string (the DATABASE_URL environment variable)
3. GitHub account and repository with your project

## Step 1: Prepare Your Project for Deployment

Your project is already set up for Vercel deployment. The key files include:

- `.env.production` - Contains the environment variables for production
- `middleware.ts` - Handles subdomains and custom domains
- `pages/api/domain-handler.ts` - API route to redirect based on domains
- `next.config.js` - Configuration for images and headers

## Step 2: Deploy to Vercel

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up or log in
   - Click "Add New" and select "Project"
   - Import your repository

2. **Configure Project Settings**
   - In the project configuration screen, add these environment variables:
     - `DATABASE_URL` - Your PostgreSQL database connection string
     - `PRIMARY_DOMAIN` - Your main domain name (e.g., yourhvacsite.com)
   - Keep the default Next.js build settings
   - Click "Deploy"

3. **Wait for Deployment**
   - Vercel will build and deploy your project
   - Once complete, you'll get a preview URL (something.vercel.app)

## Step 3: Set Up Domains

1. **Add Primary Domain**
   - Go to "Settings" → "Domains"
   - Add your primary domain
   - Follow Vercel's instructions to verify domain ownership

2. **Set Up Subdomains (Optional)**
   - To support business subdomains (e.g., business.yourhvacsite.com)
   - Add a wildcard domain: `*.yourhvacsite.com`

3. **Custom Business Domains (Optional)**
   - For each business with a custom domain, add it in Vercel domains
   - Configure the DNS records as instructed by Vercel

## Step 4: Database Schema Updates

When you update your database schema on Replit:

1. Run the same schema changes on your production database
2. Use scripts in the `scripts/` directory to apply migrations
3. Always back up your database before making changes

## Using the System

1. **Admin Portal**
   - Access the admin portal at your-domain.com/hvacportal
   - Use the appropriate credentials to login

2. **Business Websites**
   - Each business will be available at:
     - `/t/[template_key]/[slug]` - Direct template access
     - `business-slug.yourdomain.com` - If using subdomains
     - `custombusiness.com` - If using custom domains

## Troubleshooting

1. **Database Connection Issues**
   - Check that your DATABASE_URL is correctly set in Vercel
   - Verify database connection permissions allow Vercel IPs

2. **Domain Issues**
   - Make sure DNS records are properly configured
   - Allow 24-48 hours for DNS changes to fully propagate

3. **Image Loading Issues**
   - Check that the image domains are correctly listed in next.config.js
   - Add any new image domains as needed

## Getting Help

If you encounter issues, check:
- Vercel deployment logs
- Database connection logs
- Next.js build errors

For more assistance, please contact support or refer to Next.js and Vercel documentation.