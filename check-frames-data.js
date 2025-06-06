const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkFramesData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking company_frames data...');
    
    // Get sample company frames
    const framesResult = await client.query(`
      SELECT company_id, slug, url, updated_at 
      FROM company_frames 
      ORDER BY updated_at DESC 
      LIMIT 20
    `);
    
    console.log(`Found ${framesResult.rows.length} company frames:`);
    framesResult.rows.forEach((frame, i) => {
      console.log(`${i+1}. Company: ${frame.company_id} | Frame: ${frame.slug} | URL: ${frame.url.substring(0, 60)}...`);
    });
    
    // Check how many companies have frames
    const statsResult = await client.query(`
      SELECT COUNT(DISTINCT company_id) as companies_with_frames,
             COUNT(*) as total_frames
      FROM company_frames
    `);
    
    console.log('\n📊 Stats:', statsResult.rows[0]);
    
    // Check template frames for comparison
    const templateResult = await client.query(`
      SELECT template_key, slug, default_url 
      FROM frames 
      WHERE template_key = 'moderntrust'
    `);
    
    console.log('\n🎨 Template frames for moderntrust:');
    templateResult.rows.forEach((frame, i) => {
      console.log(`${i+1}. ${frame.slug}: ${frame.default_url}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkFramesData().catch(console.error);