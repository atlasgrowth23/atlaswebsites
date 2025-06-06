const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixTemplateCustomizer() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Step 1: Check if company_frames table exists...');
    
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'company_frames'
      );
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log('❌ company_frames table does not exist! Creating it...');
      
      await client.query(`
        CREATE TABLE company_frames (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          slug TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(company_id, slug)
        );
      `);
      
      console.log('✅ Created company_frames table');
    } else {
      console.log('✅ company_frames table exists');
    }
    
    console.log('\n🔍 Step 2: Check table structure...');
    const structure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'company_frames'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Table structure:');
    structure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n🔍 Step 3: Get a test company...');
    const companies = await client.query('SELECT id, name, slug FROM companies LIMIT 5;');
    if (companies.rows.length === 0) {
      console.log('❌ No companies found in database!');
      return;
    }
    
    const testCompany = companies.rows[0];
    console.log(`✅ Using test company: ${testCompany.name} (${testCompany.id})`);
    
    console.log('\n🔍 Step 4: Test manual insert...');
    const testUrl = 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800';
    
    await client.query(`
      INSERT INTO company_frames (company_id, slug, url)
      VALUES ($1, $2, $3)
      ON CONFLICT (company_id, slug) 
      DO UPDATE SET url = $3, updated_at = NOW();
    `, [testCompany.id, 'hero_img', testUrl]);
    
    console.log('✅ Manual insert successful');
    
    console.log('\n🔍 Step 5: Verify insert worked...');
    const frameCheck = await client.query(`
      SELECT * FROM company_frames 
      WHERE company_id = $1 AND slug = $2;
    `, [testCompany.id, 'hero_img']);
    
    if (frameCheck.rows.length > 0) {
      console.log('✅ Frame data found:', frameCheck.rows[0]);
    } else {
      console.log('❌ Frame data not found after insert!');
    }
    
    console.log('\n🔍 Step 6: Check how template loads data...');
    const templateQuery = await client.query(`
      SELECT c.id, c.name, c.slug,
             cf.slug as frame_slug, cf.url as frame_url
      FROM companies c
      LEFT JOIN company_frames cf ON c.id = cf.company_id
      WHERE c.id = $1;
    `, [testCompany.id]);
    
    console.log('📄 Template query result:');
    templateQuery.rows.forEach(row => {
      console.log(`  Company: ${row.name} | Frame: ${row.frame_slug} | URL: ${row.frame_url?.substring(0, 50)}...`);
    });
    
    console.log(`\n✅ Fix complete! Test with company: ${testCompany.slug}`);
    console.log(`   URL: /t/moderntrust/${testCompany.slug}`);
    console.log(`   Company ID: ${testCompany.id}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTemplateCustomizer().catch(console.error);