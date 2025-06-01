const { Client } = require('pg');

async function simpleRebuild() {
  const connectionString = 'postgresql://postgres.zjxvacezqbhyomrngynq:Matheos23$Who@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔗 Connected to database');

    // 1. CLEAN SLATE
    console.log('🗑️ Dropping and recreating companies table...');
    await client.query('DROP TABLE IF EXISTS companies CASCADE');
    
    // 2. CREATE NEW COMPANIES TABLE
    await client.query(`
      CREATE TABLE companies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        city TEXT,
        state TEXT,
        phone TEXT,
        rating DECIMAL,
        reviews INTEGER,
        place_id TEXT,
        reviews_link TEXT,
        predicted_label TEXT,
        email_1 TEXT,
        site TEXT,
        latitude DECIMAL,
        longitude DECIMAL,
        logo_storage_path TEXT, -- Only populated if predicted_label = 'logo'
        modern_trust_preview TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ New companies table created');

    // 3. UPDATE FRAMES TABLE FOR STORAGE
    console.log('🖼️ Updating frames table for Supabase Storage...');
    await client.query('DELETE FROM frames');
    
    await client.query(`
      INSERT INTO frames (slug, template_key, default_url, description) VALUES
      ('hero_img', 'moderntrust', '/storage/templates/moderntrust/hero.jpg', 'ModernTrust hero image'),
      ('about_img', 'moderntrust', '/storage/templates/moderntrust/about.jpg', 'ModernTrust about image'),
      ('logo_url', 'moderntrust', '/storage/templates/moderntrust/default-logo.svg', 'ModernTrust default logo')
    `);
    console.log('✅ Frames table updated for storage paths');

    console.log('🎉 DATABASE STRUCTURE READY!');
    console.log('📋 Next steps:');
    console.log('   1. Import CSV data manually');
    console.log('   2. Set up Supabase Storage bucket');
    console.log('   3. Update template to use storage URLs');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

simpleRebuild();