#!/bin/bash
# Execute the SQL import command
export PGPASSWORD="npg_jKkcxEWyD0l5"
DBURL="postgresql://neondb_owner:npg_jKkcxEWyD0l5@ep-lively-waterfall-a63ppdko.us-west-2.aws.neon.tech/neondb?sslmode=require"
echo "Running PSQL import..."
psql "$DBURL" -f import_companies.sql
