const { Client } = require('pg');

async function debugCompanies() {
  const connectionString = 'postgresql://postgres.zjxvacezqbhyomrngynq:Matheos23$Who@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Get sample company slugs
    console.log('🏢 Sample company slugs:');
    const companies = await client.query('SELECT slug, name FROM companies WHERE slug IS NOT NULL LIMIT 10');
    companies.rows.forEach(company => {
      console.log(`  - ${company.slug} (${company.name})`);
    });

    // Check Alabama/Arkansas companies specifically
    console.log('\n🌎 Alabama/Arkansas companies:');
    const localCompanies = await client.query(`
      SELECT slug, name, state 
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas') 
      AND slug IS NOT NULL 
      LIMIT 5
    `);
    localCompanies.rows.forEach(company => {
      console.log(`  - ${company.slug} (${company.name}, ${company.state})`);
    });

    // Check what frames we have
    console.log('\n🖼️ Template frames:');
    const frames = await client.query('SELECT template_key, slug, default_url FROM frames');
    frames.rows.forEach(frame => {
      console.log(`  - ${frame.template_key}/${frame.slug}: ${frame.default_url}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

debugCompanies();