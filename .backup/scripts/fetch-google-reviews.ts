import { query } from '@/lib/db';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Apify API key should be in .env file
const APIFY_API_KEY = process.env.APIFY_API_KEY;

interface Company {
  id: number;
  name: string;
  place_id: string | null;
}

interface Review {
  review_id: string;
  company_id: number; 
  place_id: string;
  name: string;
  text: string;
  rating: number;
  published_at_date: string;
  reviewer_photo_url: string | null;
  response_from_owner_text: string | null;
  response_from_owner_date: string | null;
  review_url: string | null;
}

async function createReviewsTableIfNotExists() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      review_id TEXT NOT NULL,
      company_id INTEGER NOT NULL,
      place_id TEXT NOT NULL,
      name TEXT,
      text TEXT NOT NULL,
      rating INTEGER NOT NULL,
      published_at_date TEXT NOT NULL,
      reviewer_photo_url TEXT,
      response_from_owner_text TEXT,
      response_from_owner_date TEXT,
      review_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(review_id, place_id),
      FOREIGN KEY (company_id) REFERENCES companies(id)
    )
  `;

  try {
    await query(createTableQuery);
    console.log('Reviews table created or already exists');
  } catch (error) {
    console.error('Error creating reviews table:', error);
    throw error;
  }
}

async function getCompaniesWithPlaceId(): Promise<Company[]> {
  try {
    const result = await query(`
      SELECT id, name, place_id 
      FROM companies 
      WHERE place_id IS NOT NULL
    `);
    return result.rows;
  } catch (error) {
    console.error('Error fetching companies with place_id:', error);
    throw error;
  }
}

async function fetchReviewsFromApify(placeId: string) {
  if (!APIFY_API_KEY) {
    throw new Error('APIFY_API_KEY environment variable is not set');
  }

  try {
    const response = await axios.post(
      'https://api.apify.com/v2/acts/junglee/google-maps-reviews-scraper/run-sync-get-dataset-items?token=' + APIFY_API_KEY,
      {
        placeId: placeId,
        startUrls: [`https://www.google.com/maps/place/?q=place_id:${placeId}`],
        language: "en",
        maxReviews: 20, // Adjust as needed
        includeReviewDetails: true
      }
    );

    return response.data;
  } catch (error) {
    console.error(`Error fetching reviews for place_id ${placeId}:`, error);
    return [];
  }
}

async function insertReview(review: Review) {
  const insertQuery = `
    INSERT INTO reviews (
      review_id, company_id, place_id, name, text, rating, 
      published_at_date, reviewer_photo_url, response_from_owner_text, 
      response_from_owner_date, review_url
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
    )
    ON CONFLICT (review_id, place_id) 
    DO UPDATE SET
      name = $4,
      text = $5,
      rating = $6,
      published_at_date = $7,
      reviewer_photo_url = $8,
      response_from_owner_text = $9,
      response_from_owner_date = $10,
      review_url = $11,
      updated_at = NOW()
    RETURNING id
  `;

  try {
    const result = await query(insertQuery, [
      review.review_id,
      review.company_id,
      review.place_id,
      review.name,
      review.text,
      review.rating,
      review.published_at_date,
      review.reviewer_photo_url,
      review.response_from_owner_text,
      review.response_from_owner_date,
      review.review_url
    ]);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error inserting review:', error);
    throw error;
  }
}

async function updateCompanyReviewStats(companyId: number) {
  const updateQuery = `
    UPDATE companies
    SET 
      reviews = (SELECT COUNT(*) FROM reviews WHERE company_id = $1),
      rating = (SELECT AVG(rating) FROM reviews WHERE company_id = $1)
    WHERE id = $1
    RETURNING reviews, rating
  `;

  try {
    const result = await query(updateQuery, [companyId]);
    return result.rows[0];
  } catch (error) {
    console.error(`Error updating review stats for company ID ${companyId}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Create reviews table if it doesn't exist
    await createReviewsTableIfNotExists();

    // Get companies with place_id
    const companies = await getCompaniesWithPlaceId();
    console.log(`Found ${companies.length} companies with place_id`);

    for (const company of companies) {
      if (!company.place_id) continue;
      
      console.log(`Fetching reviews for ${company.name} (place_id: ${company.place_id})`);
      
      // Fetch reviews from Apify
      const reviews = await fetchReviewsFromApify(company.place_id);
      console.log(`Retrieved ${reviews.length} reviews`);

      // Process and insert each review
      let insertedCount = 0;
      for (const reviewData of reviews) {
        try {
          // Transform Apify review format to our database format
          const review: Review = {
            review_id: reviewData.reviewId || reviewData.id,
            company_id: company.id,
            place_id: company.place_id,
            name: reviewData.reviewerName,
            text: reviewData.reviewText,
            rating: reviewData.stars || reviewData.rating,
            published_at_date: reviewData.publishedAtDate,
            reviewer_photo_url: reviewData.reviewerPhotoUrl,
            response_from_owner_text: reviewData.responseText,
            response_from_owner_date: reviewData.responseDate,
            review_url: reviewData.reviewUrl
          };

          await insertReview(review);
          insertedCount++;
        } catch (error) {
          console.error('Error processing review:', error);
        }
      }

      console.log(`Inserted ${insertedCount} reviews for ${company.name}`);

      // Update company review stats
      if (insertedCount > 0) {
        const stats = await updateCompanyReviewStats(company.id);
        console.log(`Updated company stats: reviews=${stats.reviews}, rating=${stats.rating}`);
      }
    }

    console.log('Review fetching process completed successfully');
  } catch (error) {
    console.error('Error in main process:', error);
  }
}

// Run the script
main();