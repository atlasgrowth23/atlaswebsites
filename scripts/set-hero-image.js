const { Pool } = require('pg');
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function setHeroImage() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting hero image for Accuracy Heat & Air LLC...');
    
    // First, find the company
    const companyResult = await client.query(`
      SELECT id, slug FROM companies 
      WHERE name ILIKE '%accuracy%heat%air%' OR slug = 'accuracy-heat-air-llc'
      LIMIT 1
    `);
    
    if (companyResult.rows.length === 0) {
      console.log('❌ Company not found');
      return;
    }
    
    const company = companyResult.rows[0];
    console.log('✓ Found company:', company.id, company.slug);
    
    // Download and process the image URL to get a storage path
    const imageUrl = 'https://lh3.googleusercontent.com/p/AF1QipMmD4wnhPkltkbKyOM55aF-pM726mIqxEl1dnsW=s680-w680-h510-rw';
    
    // For now, we'll store the direct URL in company_frames
    // This matches the pattern used in template-customizations.ts
    await client.query(`
      INSERT INTO company_frames (company_id, slug, url)
      VALUES ($1, 'hero_img', $2)
      ON CONFLICT (company_id, slug) 
      DO UPDATE SET url = $2, updated_at = NOW()
    `, [company.id, imageUrl]);
    
    console.log('✓ Hero image set successfully');
    console.log('🔗 Image URL:', imageUrl);
    console.log('🌐 View at: https://atlasgrowth.ai/t/moderntrust/' + company.slug);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setHeroImage().catch(console.error);