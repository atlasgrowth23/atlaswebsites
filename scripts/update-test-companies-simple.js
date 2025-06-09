const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateTestCompaniesSimple() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Updating test companies with existing columns only...');
    
    // Just update the basic fields that already exist
    await client.query(`
      UPDATE companies SET
        email_1 = 'contact@' || slug || '.com',
        rating = 4.8,
        reviews = 45,
        r_30 = 8,
        r_60 = 15,
        r_90 = 28,
        r_365 = 45
      WHERE predicted_label = 'test_company'
    `);
    
    console.log('✓ Updated test companies with basic data');
    
    // Add template customizations
    const { rows: testCompanies } = await client.query(`
      SELECT id, slug FROM companies WHERE predicted_label = 'test_company'
    `);
    
    for (const company of testCompanies) {
      // Add hero image
      await client.query(`
        INSERT INTO template_customizations (company_id, template_key, customization_type, custom_value, created_at)
        VALUES ($1, 'moderntrust', 'hero_img', '/images/hvac-hero-bg.jpg', NOW())
        ON CONFLICT (company_id, template_key, customization_type) 
        DO UPDATE SET custom_value = EXCLUDED.custom_value
      `, [company.id]);
      
      console.log(`✓ Added hero image for ${company.slug}`);
    }
    
    console.log('✅ Test companies ready for ModernTrust preview!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

updateTestCompaniesSimple();