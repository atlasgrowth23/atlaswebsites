const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testTemplateSave() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Testing template customization save...');
    
    // Test company ID from the logs
    const companyId = '2e700563-a239-4c4d-a138-7490a47a95a1';
    const frameKey = 'hero_img';
    const imageUrl = 'https://lh3.googleusercontent.com/p/AF1QipN2crl0ME70NH9bgf_l1TU0fcuw3ndoDkyBERY=s680-w680-h510-rw';
    
    console.log(`🔧 Attempting to save: company_id=${companyId}, slug=${frameKey}, url=${imageUrl}`);
    
    // Test the exact same query the API uses
    const result = await client.query(`
      INSERT INTO company_frames (company_id, slug, url, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (company_id, slug) 
      DO UPDATE SET url = $3, updated_at = NOW()
      RETURNING *;
    `, [companyId, frameKey, imageUrl]);
    
    console.log(`💾 Database result:`, result.rows[0]);
    
    // Verify it was saved
    const checkResult = await client.query(`
      SELECT * FROM company_frames WHERE company_id = $1 AND slug = $2;
    `, [companyId, frameKey]);
    
    console.log(`✅ Verification query result:`, checkResult.rows[0]);
    
    if (checkResult.rows.length > 0) {
      console.log('🎉 SUCCESS: Data was saved to database!');
    } else {
      console.log('❌ FAILED: Data was not saved to database!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testTemplateSave().catch(console.error);