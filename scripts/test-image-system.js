const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testImageSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🧪 Testing image system...\n');
    
    // 1. Test template frames
    console.log('1️⃣ Template defaults (frames table):');
    const frames = await client.query(`
      SELECT slug, default_url, description 
      FROM frames 
      WHERE template_key = 'moderntrust' 
      ORDER BY slug
    `);
    
    frames.rows.forEach(frame => {
      console.log(`   ${frame.slug}: ${frame.default_url}`);
    });
    
    // 2. Test a real company's template
    console.log('\n2️⃣ Sample company template data:');
    const company = await client.query(`
      SELECT c.id, c.name, c.slug,
             cf_hero.url as hero_img_custom,
             cf_hero2.url as hero_img_2_custom,
             cf_about.url as about_img_custom
      FROM companies c 
      LEFT JOIN company_frames cf_hero ON c.id = cf_hero.company_id AND cf_hero.slug = 'hero_img'
      LEFT JOIN company_frames cf_hero2 ON c.id = cf_hero2.company_id AND cf_hero2.slug = 'hero_img_2'  
      LEFT JOIN company_frames cf_about ON c.id = cf_about.company_id AND cf_about.slug = 'about_img'
      WHERE c.state IN ('Alabama', 'Arkansas')
      LIMIT 1
    `);
    
    if (company.rows.length > 0) {
      const comp = company.rows[0];
      console.log(`   Company: ${comp.name} (${comp.slug})`);
      console.log(`   Hero 1: ${comp.hero_img_custom || 'Using template default'}`);
      console.log(`   Hero 2: ${comp.hero_img_2_custom || 'Using template default'}`);
      console.log(`   About: ${comp.about_img_custom || 'Using template default'}`);
    }
    
    // 3. Show image resolution logic
    console.log('\n3️⃣ Image resolution flow:');
    console.log('   1. Check company_frames for custom override');
    console.log('   2. Fall back to frames table template default');
    console.log('   3. getPhotoUrl() handles this cascade automatically');
    
    console.log('\n✅ Image system test complete!');
    console.log('\n📝 How to test the full workflow:');
    console.log('   1. Go to /template-editor?slug=COMPANY_SLUG');
    console.log('   2. Update any of the 3 image fields');
    console.log('   3. Save changes');
    console.log('   4. Visit /t/moderntrust/COMPANY_SLUG to see updates');
    console.log('   5. Changes should appear within 30 seconds');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testImageSystem().catch(console.error);