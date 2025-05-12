# Database Setup Scripts

This folder contains essential scripts for database setup and maintenance.

## Important Production Scripts

These scripts are needed for production setup:

- `create-hvac-tables.ts` - Creates the core tables for HVAC business functionality
- `create-message-tables.ts` - Creates tables for the messaging system

## Development Scripts

All other scripts have been moved to the `old` directory to avoid TypeScript build errors in Vercel. These scripts can still be useful during development but aren't needed for production builds.

## Usage

To set up database tables for a new installation:

```bash
# Create the basic tables for HVAC businesses
npx tsx scripts/create-hvac-tables.ts

# Create the messaging tables
npx tsx scripts/create-message-tables.ts
```

If you need any other utility scripts for development, look in the `old` directory or create new ones based on these examples.