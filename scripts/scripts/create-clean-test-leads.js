const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function createCleanTestLeads() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating clean test leads...');
    
    // First, delete any existing broken test leads
    await client.query(`
      DELETE FROM lead_pipeline WHERE pipeline_type = 'atlas_test_pipeline';
    `);
    console.log('✓ Cleared existing test leads');
    
    // Create test companies and leads
    const testCompanies = [
      { name: 'Test HVAC Company 1', city: 'Birmingham', state: 'AL', phone: '205-555-0001' },
      { name: 'Test Cooling Solutions', city: 'Montgomery', state: 'AL', phone: '334-555-0002' },
      { name: 'Test Air Comfort', city: 'Mobile', state: 'AL', phone: '251-555-0003' },
      { name: 'Test Climate Control', city: 'Huntsville', state: 'AL', phone: '256-555-0004' },
      { name: 'Test Heating & Air', city: 'Tuscaloosa', state: 'AL', phone: '205-555-0005' }
    ];
    
    for (const company of testCompanies) {
      // Create company
      const { rows: [newCompany] } = await client.query(`
        INSERT INTO companies (name, city, state, phone, slug, tracking_enabled, predicted_label)
        VALUES ($1, $2, $3, $4, $5, true, 'test_company')
        RETURNING id, slug;
      `, [
        company.name,
        company.city, 
        company.state,
        company.phone,
        company.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
      ]);
      
      // Create lead for this company
      await client.query(`
        INSERT INTO lead_pipeline (company_id, pipeline_type, stage, created_at, updated_at)
        VALUES ($1, 'atlas_test_pipeline', 'new_lead', NOW(), NOW());
      `, [newCompany.id]);
      
      console.log(`✓ Created test company: ${company.name} (${newCompany.slug})`);
    }
    
    // Verify creation
    const { rows: testLeads } = await client.query(`
      SELECT lp.id, lp.stage, c.name, c.phone
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      WHERE lp.pipeline_type = 'atlas_test_pipeline';
    `);
    
    console.log(`\n✅ Created ${testLeads.length} clean test leads:`);
    testLeads.forEach(lead => {
      console.log(`  ${lead.name} (${lead.phone}) - Stage: ${lead.stage}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createCleanTestLeads();