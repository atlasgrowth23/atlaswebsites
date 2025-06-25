# Plumbers Data Processing Workflow

This documents the complete process to transform raw Outscraper JSON data into clean, usable datasets.

## Key Files to Keep

### 1. Source Data
- `Outscraper-20250620095312xs18_plumber_lr.json` - Original JSON from Outscraper (6.3MB)

### 2. Final Datasets  
- `plumbers-mobile-with-status.csv` - Clean plumbers list (57 mobile-only records)
- `plumbers-reviews-final.csv` - All scraped reviews (linked by place_id)

### 3. Processing Scripts
- `fix-carrier-type.js` - Extracts carrier types from JSON
- `fix-working-hours.js` - Converts working hours objects to readable strings  
- `filter-mobile-and-check-sites.js` - Filters mobile-only + checks website status
- `scrape-all-reviews.js` - Scrapes Google reviews via Apify API

## Process Steps

### Step 1: Extract Carrier Types
```bash
node fix-carrier-type.js
```
- Maps `phone.phones_enricher.carrier_type` from JSON to CSV
- Uses place_id for matching
- Result: carrier_type column populated (mobile/landline)

### Step 2: Fix Working Hours
```bash  
node fix-working-hours.js
```
- Converts `[object Object]` to readable format
- Maps working_hours from JSON using place_id
- Result: "Monday: 7AM-6PM, Tuesday: 7AM-6PM..." format

### Step 3: Filter Mobile + Check Websites
```bash
node filter-mobile-and-check-sites.js  
```
- Removes all landline/fixed line phones
- Checks website status for each business
- Result: 57 mobile-only records with site_status column

### Step 4: Scrape Reviews (Optional)
```bash
node scrape-all-reviews.js
```
- Scrapes reviews for businesses with 3-100 reviews
- Uses Apify Google Maps Reviews Scraper API
- Result: Separate reviews CSV linked by place_id

## Data Transformations

**Original:** 128 total records → **Final:** 57 mobile-only records

### Removed Records
- 71 landline/fixed line phone numbers
- Businesses without mobile contact info

### Added Data  
- ✅ Carrier types (mobile/landline identification)
- ✅ Readable working hours
- ✅ Website status checks (Up/Down/No Website)
- ✅ Google reviews data (separate table)

## For Electricians Dataset

Use the same scripts on your electricians JSON:

1. Replace file paths in scripts to point to electricians JSON/CSV
2. Run same 4-step process
3. Will produce matching dataset structure

## Database Schema

### plumbers_businesses table
- All columns from `plumbers-mobile-with-status.csv`
- Primary key: place_id

### plumbers_reviews table  
- All columns from `plumbers-reviews-final.csv`
- Foreign key: place_id → plumbers_businesses.place_id

This allows joining business info with their reviews as needed.