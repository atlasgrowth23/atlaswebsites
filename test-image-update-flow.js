const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testImageUpdateFlow() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing image update flow...');
    
    // Get a company with frames to test
    const companyResult = await client.query(`
      SELECT c.id, c.slug, c.name 
      FROM companies c
      JOIN company_frames cf ON c.id = cf.company_id
      WHERE c.state IN ('Alabama', 'Arkansas')
      LIMIT 1
    `);
    
    if (companyResult.rows.length === 0) {
      console.log('❌ No companies with frames found');
      return;
    }
    
    const company = companyResult.rows[0];
    console.log(`\n📋 Testing with company: ${company.name} (${company.slug})`);
    
    // Get all frames for this company
    const framesResult = await client.query(`
      SELECT slug, url 
      FROM company_frames 
      WHERE company_id = $1
      ORDER BY slug
    `, [company.id]);
    
    console.log('\n🖼️ Current frames:');
    framesResult.rows.forEach(frame => {
      console.log(`  ${frame.slug}: ${frame.url.substring(0, 80)}...`);
    });
    
    // Test the template customizations API by simulating what happens when saving
    console.log('\n🧪 Simulating template customization save...');
    
    // Test if the getPhotoUrl function would work correctly
    const mockCompany = {
      id: company.id,
      slug: company.slug,
      name: company.name,
      company_frames: {},
      template_frames: {}
    };
    
    // Add frames to mock company object (like the template page does)
    framesResult.rows.forEach(frame => {
      mockCompany.company_frames[frame.slug] = frame.url;
    });
    
    // Add template frames
    const templateFramesResult = await client.query(`
      SELECT slug, default_url 
      FROM frames 
      WHERE template_key = 'moderntrust'
    `);
    
    templateFramesResult.rows.forEach(frame => {
      mockCompany.template_frames[frame.slug] = frame.default_url;
    });
    
    console.log('\n🔄 Mock company object ready for getPhotoUrl:');
    console.log(`  Company frames: ${Object.keys(mockCompany.company_frames).length}`);
    console.log(`  Template frames: ${Object.keys(mockCompany.template_frames).length}`);
    
    // Test getPhotoUrl logic manually
    function testGetPhotoUrl(company, frameName, templateKey) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      // First try company-specific frame (custom override)
      if (company?.company_frames && company.company_frames[frameName]) {
        const path = company.company_frames[frameName];
        const url = path.startsWith('http') ? path : `${supabaseUrl}/storage/v1/object/public/images${path}`;
        return url;
      }
      
      // Then try template default frame
      if (company?.template_frames && company.template_frames[frameName]) {
        const path = company.template_frames[frameName];
        const url = path.startsWith('http') ? path : `${supabaseUrl}/storage/v1/object/public/images${path}`;
        return url;
      }
      
      return null;
    }
    
    console.log('\n🎯 Testing getPhotoUrl for each frame:');
    ['hero_img', 'hero_img_2', 'about_img'].forEach(frameName => {
      const url = testGetPhotoUrl(mockCompany, frameName, 'moderntrust');
      console.log(`  ${frameName}: ${url ? url.substring(0, 80) + '...' : 'NULL'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

testImageUpdateFlow().catch(console.error);