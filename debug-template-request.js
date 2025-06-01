const { Client } = require('pg');

async function debugTemplateRequest() {
  const connectionString = 'postgresql://postgres.zjxvacezqbhyomrngynq:Matheos23$Who@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Test the exact query that the template page uses
    console.log('🔍 Testing template page query for airzone-llc...');
    
    const companyResult = await client.query('SELECT * FROM companies WHERE slug = $1', ['airzone-llc']);
    
    if (companyResult.rows.length === 0) {
      console.log('❌ No company found with slug "airzone-llc"');
      return;
    }
    
    const company = companyResult.rows[0];
    console.log('✅ Company found:', {
      id: company.id,
      name: company.name,
      slug: company.slug,
      state: company.state
    });
    
    // Test the frames queries
    const companyFrames = await client.query('SELECT slug, url FROM company_frames WHERE company_id = $1', [company.id]);
    console.log('🖼️ Company frames:', companyFrames.rows);
    
    const templateFrames = await client.query('SELECT slug, default_url FROM frames WHERE template_key = $1', ['moderntrust']);
    console.log('🎨 Template frames:', templateFrames.rows);
    
  } catch (error) {
    console.error('❌ Error in template query:', error.message);
  } finally {
    await client.end();
  }
}

debugTemplateRequest();