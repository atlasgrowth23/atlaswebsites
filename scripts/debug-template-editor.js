const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugTemplateEditor() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging template editor workflow...\n');
    
    // 1. Find real company slugs
    console.log('1️⃣ Available company slugs:');
    const companies = await client.query(`
      SELECT id, name, slug, state 
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas') 
      ORDER BY name 
      LIMIT 5
    `);
    
    companies.rows.forEach(company => {
      console.log(`   ${company.slug} (${company.name})`);
    });
    
    if (companies.rows.length === 0) {
      console.log('❌ No companies found!');
      return;
    }
    
    const testCompany = companies.rows[0];
    console.log(`\n2️⃣ Testing with: ${testCompany.slug}`);
    
    // 2. Check what template-customizations API expects
    console.log('\n3️⃣ Testing company lookup in template-customizations logic:');
    
    // This mirrors the logic in template-customizations.ts
    const companyLookup = await client.query(`
      SELECT * FROM companies WHERE slug = $1
    `, [testCompany.slug]);
    
    if (companyLookup.rows.length > 0) {
      console.log('   ✅ Company found in direct lookup');
      console.log(`   ID: ${companyLookup.rows[0].id}`);
    } else {
      console.log('   ❌ Company NOT found in direct lookup');
    }
    
    // 3. Check existing company_frames
    console.log('\n4️⃣ Current company_frames for this company:');
    const existingFrames = await client.query(`
      SELECT slug, url 
      FROM company_frames 
      WHERE company_id = $1
    `, [testCompany.id]);
    
    if (existingFrames.rows.length > 0) {
      existingFrames.rows.forEach(frame => {
        console.log(`   ${frame.slug}: ${frame.url}`);
      });
    } else {
      console.log('   No custom frames (will use template defaults)');
    }
    
    console.log('\n5️⃣ Template URLs to test:');
    console.log(`   GET: /api/template-customizations?slug=${testCompany.slug}`);
    console.log(`   Template Editor: /template-editor?slug=${testCompany.slug}`);
    console.log(`   Live Site: /t/moderntrust/${testCompany.slug}`);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugTemplateEditor().catch(console.error);