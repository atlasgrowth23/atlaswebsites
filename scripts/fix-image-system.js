const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixImageSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Fixing image system...');
    
    // 1. Check current frames table
    const currentFrames = await client.query(`
      SELECT * FROM frames WHERE template_key = 'moderntrust'
    `);
    console.log('📋 Current frames:', currentFrames.rows);
    
    // 2. Delete existing ModernTrust frames to start fresh
    await client.query(`
      DELETE FROM frames WHERE template_key = 'moderntrust'
    `);
    console.log('🗑️ Cleared existing ModernTrust frames');
    
    // 3. Insert proper template defaults with different images
    await client.query(`
      INSERT INTO frames (template_key, slug, default_url, description) VALUES 
      ('moderntrust', 'hero_img', '/templates/moderntrust/hero.jpg', 'Primary hero background'),
      ('moderntrust', 'hero_img_2', '/templates/moderntrust/about.jpg', 'Secondary hero background'), 
      ('moderntrust', 'about_img', '/templates/moderntrust/about.jpg', 'About section image')
    `);
    console.log('✅ Added proper template defaults');
    
    // 4. Check what we have now
    const newFrames = await client.query(`
      SELECT * FROM frames WHERE template_key = 'moderntrust'
    `);
    console.log('📋 New frames:');
    newFrames.rows.forEach(row => {
      console.log(`  - ${row.slug}: ${row.default_url}`);
    });
    
    // 5. Check current company_frames
    const companyFrames = await client.query(`
      SELECT cf.*, c.name, c.slug as company_slug 
      FROM company_frames cf 
      JOIN companies c ON cf.company_id = c.id 
      LIMIT 5
    `);
    console.log('📋 Sample company frames:');
    companyFrames.rows.forEach(row => {
      console.log(`  - ${row.company_slug}: ${row.slug} = ${row.url}`);
    });
    
    console.log('\n🎉 Image system database fixed!');
    console.log('Next steps:');
    console.log('1. Update template editor to show all 3 image options');
    console.log('2. Add cache invalidation for image updates');
    console.log('3. Test image editing workflow');
    
  } catch (error) {
    console.error('❌ Error fixing image system:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixImageSystem().catch(console.error);