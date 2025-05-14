# HVAC Business Data Processing Scripts

This directory contains scripts for processing HVAC business data from CSV files, importing them into the database, and fetching Google reviews.

## CSV Data Processing

The following scripts are used to process the raw CSV data files:

- `transform-filtered-csv.js` - Transforms and filters businesses using specific criteria (mobile/voip phones, HVAC categories, 5-300 reviews)
- `clean-csv.js` - Cleans formatting issues in CSV files
- `process-arkansas-csv.js` - Processes the Arkansas dataset with the same filters

## Database Import

These scripts handle importing the processed data into the database:

- `simplified-import.js` - Imports processed CSV data to the database with proper formatting
- `fix-import.js` - Handles issues with numeric fields during import
- `organize-files.js` - Organizes CSV files into appropriate directories

## Google Reviews

These scripts manage the Google reviews functionality:

- `create-reviews-by-place-id.js` - Creates database tables for storing reviews
- `test-reviews-api.js` - Tests the Apify Google Reviews API with a sample business
- `fetch-all-reviews.js` - Fetches reviews for all businesses and stores them in the database and CSV files

## Usage Instructions

### Fetch Google Reviews for All Businesses

To fetch Google reviews for all businesses with place_ids:

```bash
node scripts/fetch-all-reviews.js
```

Configuration options are available at the top of the script:

```javascript
const CONFIG = {
  batchSize: 10,            // Number of companies to process in each batch
  maxReviewsPerCompany: 0,  // Set to 0 for unlimited reviews
  delayBetweenBatches: 5000, // Delay between batches in ms
  exportCsv: true,          // Export reviews to CSV
  logLevel: 'verbose',      // 'verbose' or 'normal'
  limit: 0,                 // Maximum number of companies to process (0 = no limit)
  stateFilter: null,        // Optional state filter (e.g., 'Alabama')
  skipExisting: true        // Skip companies that already have reviews
};
```

You can modify these settings to customize the review fetching process:

- To fetch only Alabama businesses: Set `stateFilter: 'Alabama'`
- To limit the number of businesses: Set `limit: 50` (for example)
- To process larger batches: Increase `batchSize` (may hit API limits)
- To fetch all reviews, even for businesses that already have them: Set `skipExisting: false`

### Organize Files

To organize CSV files into appropriate directories:

```bash
node scripts/organize-files.js
```

This will copy CSV files to these folders:
- `data/raw/` - Raw CSV files from Outscraper
- `data/processed/` - Filtered and transformed CSV files
- `data/reviews/` - Review CSV export files

## Database Schema

The reviews system uses the following tables:

### company_reviews
Stores individual Google reviews for businesses:
- `id` - Auto-incrementing ID
- `review_id` - Unique review ID from Google
- `company_id` - Company ID from the companies table
- `place_id` - Google Maps place_id
- `reviewer_name` - Name of reviewer
- `review_text` - Text content of review
- `rating` - Star rating (1-5)
- `published_at` - When review was published
- `reviewer_photo_url` - URL to reviewer's photo
- `response_from_owner_text` - Response from business owner
- `response_from_owner_date` - When owner responded
- `review_url` - URL to the review
- `created_at` - When review was added to database

### company_review_stats
Stores aggregated review statistics for businesses:
- `place_id` - Google Maps place_id (primary key)
- `company_id` - Company ID from companies table
- `company_name` - Name of the company
- `total_reviews` - Total number of reviews
- `average_rating` - Average star rating
- `reviews_5_star` - Count of 5-star reviews
- `reviews_4_star` - Count of 4-star reviews
- `reviews_3_star` - Count of 3-star reviews
- `reviews_2_star` - Count of 2-star reviews
- `reviews_1_star` - Count of 1-star reviews
- `latest_review_date` - Date of most recent review
- `state` - State where business is located
- `city` - City where business is located
- `updated_at` - When stats were last updated