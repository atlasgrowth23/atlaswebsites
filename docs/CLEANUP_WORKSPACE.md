# Workspace Cleanup Plan

## Files to Keep (Essential)

### 1. Source Data
- `Outscraper-20250620095312xs18_plumber_lr.json` - Original plumbers JSON
- `plumbers-mobile-with-status.csv` - Final clean plumbers dataset

### 2. Processing Scripts  
- `fix-carrier-type.js` - Extract carrier types from JSON
- `fix-working-hours.js` - Fix working hours format
- `filter-mobile-and-check-sites.js` - Filter mobile + check websites
- `scrape-all-reviews.js` - Scrape Google reviews

### 3. Documentation
- `PROCESS_DOCUMENTATION.md` - Complete workflow documentation

## Files to Delete (Intermediate/Duplicate)

### Intermediate CSV Files
- `plumbers-export.csv` - Original export
- `plumbers-export-fixed.csv` - After carrier fix
- `plumbers-export-final.csv` - After hours fix  
- `plumbers-mobile-only.csv` - Before website check
- `plumbers-mobile-with-status.csv` - KEEP (final version)

### Test Files
- `stiefvater_reviews.json` - Test API response
- `stiefvater_reviews.csv` - Test CSV conversion
- `convert-reviews-to-csv.js` - Test script

### Utility Scripts (Can Delete)
- `filter-mobile-only.js` - Duplicate functionality

## Recommended Action
Keep only the 7 essential files listed above. This maintains the complete workflow for replicating with electricians data while removing 90% of the intermediate files.