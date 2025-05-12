#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Preparing HVAC Platform for Deployment...${NC}"

# Clean previous build folders
echo -e "\n${YELLOW}Cleaning previous build artifacts...${NC}"
rm -rf .next
rm -rf node_modules/.cache

# Remove unnecessary admin and supabase files
echo -e "\n${YELLOW}Removing admin & deprecated files...${NC}"
rm -rf pages/admin components/admin
rm -f pages/api/setup-frames.js pages/api/insert-frame.js pages/api/setup-database.js 
rm -f pages/api/schema-info.js pages/api/replit-schema-info.ts pages/schema.tsx
rm -f pages/api/db-test.ts pages/api/create-table.js pages/api/default-credentials.ts
rm -f pages/api/company-id.ts pages/api/jobs.ts
# Move all scripts to old directory except create-hvac-tables.ts and create-message-tables.ts
mkdir -p scripts/old
find scripts -type f -not -name "create-hvac-tables.ts" -not -name "create-message-tables.ts" -exec mv {} scripts/old/ \; 2>/dev/null || true

# Run next build to check for TypeScript errors
echo -e "\n${YELLOW}Running TypeScript check...${NC}"
npx tsc --noEmit
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ TypeScript check passed!${NC}"
else
  echo -e "${RED}✗ TypeScript check failed. Please fix the errors before deploying.${NC}"
  exit 1
fi

# Run next build
echo -e "\n${YELLOW}Building Next.js project...${NC}"
npm run build
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Build successful!${NC}"
else
  echo -e "${RED}✗ Build failed. Please fix the errors before deploying.${NC}"
  exit 1
fi

echo -e "\n${GREEN}============================================${NC}"
echo -e "${GREEN}Project ready for deployment!${NC}"
echo -e "${GREEN}============================================${NC}"
echo -e "\n${YELLOW}IMPORTANT:${NC} Make sure to set these environment variables in Vercel:"
echo -e "  - DATABASE_URL"
echo -e "  - PRIMARY_DOMAIN"
echo -e "  - REVALIDATE_SECRET"
echo -e "\nSee VERCEL_DEPLOYMENT.md for complete instructions."