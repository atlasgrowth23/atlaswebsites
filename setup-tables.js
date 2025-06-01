const { Client } = require('pg');

async function setupTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase database');

    // Check if companies table exists and has data
    const companiesCheck = await client.query('SELECT COUNT(*) FROM companies');
    console.log(`📊 Found ${companiesCheck.rows[0].count} companies in database`);

    // Create company_frames table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_frames (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id TEXT NOT NULL,
        slug TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(company_id, slug)
      );
    `);
    console.log('✅ Created company_frames table');

    // Create frames table for template defaults
    await client.query(`
      CREATE TABLE IF NOT EXISTS frames (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        slug TEXT NOT NULL,
        template_key TEXT NOT NULL,
        default_url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(template_key, slug)
      );
    `);
    console.log('✅ Created frames table');

    // Insert some default template frames
    await client.query(`
      INSERT INTO frames (slug, template_key, default_url, description) 
      VALUES 
        ('hero_img', 'moderntrust', '/images/default-hero.jpg', 'Default hero image'),
        ('logo_url', 'moderntrust', '/images/default-logo.svg', 'Default logo'),
        ('about_img', 'moderntrust', '/images/default-hero.jpg', 'Default about image')
      ON CONFLICT (template_key, slug) DO NOTHING;
    `);
    console.log('✅ Added default template frames');

    console.log('🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

setupTables();