const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function addTemplateDataToTestCompanies() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding template data to test companies...');
    
    // Get test companies
    const { rows: testCompanies } = await client.query(`
      SELECT id, name, slug FROM companies 
      WHERE predicted_label = 'test_company'
    `);
    
    console.log(`Found ${testCompanies.length} test companies`);
    
    for (const company of testCompanies) {
      // Add all the fields ModernTrust template needs
      await client.query(`
        UPDATE companies SET
          email_1 = $1,
          rating = $2,
          reviews = $3,
          reviews_link = $4,
          emergency_service = true,
          display_city = $5,
          r_30 = $6,
          r_60 = $7,
          r_90 = $8,
          r_365 = $9
        WHERE id = $10
      `, [
        `contact@${company.slug}.com`,
        4.8, // Good rating
        45, // Number of reviews  
        `https://google.com/search?q=${company.slug}+reviews`,
        company.name.includes('Birmingham') ? 'Birmingham' : 
        company.name.includes('Montgomery') ? 'Montgomery' :
        company.name.includes('Mobile') ? 'Mobile' : 
        company.name.includes('Huntsville') ? 'Huntsville' : 'Tuscaloosa',
        8, // Recent reviews
        15,
        28, 
        45,
        company.id
      ]);
      
      console.log(`✓ Updated ${company.name} with template data`);
    }
    
    // Also add template customizations for hero images
    console.log('Adding template customizations...');
    
    for (const company of testCompanies) {
      // Add hero image customization
      await client.query(`
        INSERT INTO template_customizations (company_id, template_key, customization_type, custom_value, created_at)
        VALUES ($1, 'moderntrust', 'hero_img', '/images/hvac-hero-bg.jpg', NOW())
        ON CONFLICT (company_id, template_key, customization_type) 
        DO UPDATE SET custom_value = EXCLUDED.custom_value
      `, [company.id]);
      
      // Add about image customization  
      await client.query(`
        INSERT INTO template_customizations (company_id, template_key, customization_type, custom_value, created_at)
        VALUES ($1, 'moderntrust', 'about_img', '/stock/moderntrust/about_img.svg', NOW())
        ON CONFLICT (company_id, template_key, customization_type)
        DO UPDATE SET custom_value = EXCLUDED.custom_value
      `, [company.id]);
      
      console.log(`✓ Added customizations for ${company.name}`);
    }
    
    console.log('✅ All test companies now have complete template data!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addTemplateDataToTestCompanies();