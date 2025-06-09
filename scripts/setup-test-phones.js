const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function setupTestPhones() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up test phone numbers...');
    
    // Get 3 businesses from any pipeline with good data
    const { rows: businesses } = await client.query(`
      SELECT c.id, c.name, c.slug, c.city, c.state, c.phone, c.rating, c.reviews
      FROM companies c
      JOIN lead_pipeline lp ON c.id = lp.company_id 
      WHERE c.rating >= 4.0 AND c.reviews >= 5
      ORDER BY c.rating DESC
      LIMIT 3
    `);
    
    console.log(`Found ${businesses.length} businesses to use for testing`);
    
    const testPhones = ['205-500-5170', '601-613-7813', '256-555-0003'];
    
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      const testPhone = testPhones[i];
      
      // Update phone number
      await client.query(`
        UPDATE companies 
        SET phone = $1
        WHERE id = $2
      `, [testPhone, business.id]);
      
      console.log(`✓ ${business.name} (${business.city}, ${business.state})`);
      console.log(`  Phone: ${business.phone} → ${testPhone}`);
      console.log(`  Rating: ${business.rating} (${business.reviews} reviews)`);
      console.log(`  Preview: /t/moderntrust/${business.slug}`);
      console.log('');
    }
    
    console.log('✅ Test phone numbers set! ModernTrust previews should work perfectly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestPhones();