// Set environment variable directly
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_jKkcxEWyD0l5@ep-lively-waterfall-a63ppdko.us-west-2.aws.neon.tech/neondb?sslmode=require'

import { query } from '../lib/db'

async function createTables() {
  console.log('🚀 Creating Supabase tables...')
  
  try {
    // Create companies table
    console.log('Creating companies table...')
    await query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        phone TEXT,
        email TEXT,
        website TEXT,
        address TEXT,
        city TEXT,
        state TEXT,
        postal_code TEXT,
        rating DECIMAL(2,1),
        review_count INTEGER DEFAULT 0,
        logo TEXT,
        custom_domain TEXT,
        hours TEXT,
        saturday_hours TEXT,
        sunday_hours TEXT,
        emergency_service BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    console.log('✅ Companies table created')

    // Create company_frames table
    console.log('Creating company_frames table...')
    await query(`
      CREATE TABLE IF NOT EXISTS company_frames (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        slug TEXT NOT NULL,
        url TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(company_id, slug)
      )
    `)
    console.log('✅ Company frames table created')

    // Create template frames table
    console.log('Creating frames table...')
    await query(`
      CREATE TABLE IF NOT EXISTS frames (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        slug TEXT NOT NULL,
        template_key TEXT NOT NULL,
        default_url TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(slug, template_key)
      )
    `)
    console.log('✅ Template frames table created')

    // Add indexes
    console.log('Creating indexes...')
    await query('CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug)')
    await query('CREATE INDEX IF NOT EXISTS idx_companies_city_state ON companies(city, state)')
    await query('CREATE INDEX IF NOT EXISTS idx_company_frames_company_id ON company_frames(company_id)')
    console.log('✅ Indexes created')

    // Insert default template frames
    console.log('Adding default template frames...')
    await query(`
      INSERT INTO frames (slug, template_key, default_url, description) VALUES
        ('hero_img', 'moderntrust', '/images/hvac-hero-bg.jpg', 'Default hero background for ModernTrust template'),
        ('hero_img_2', 'moderntrust', '/images/hvac-hero-bg.svg', 'Alternate hero background for ModernTrust template'),
        ('about_img', 'moderntrust', '/images/default-hero.jpg', 'Default about section image for ModernTrust template')
      ON CONFLICT (slug, template_key) DO NOTHING
    `)
    console.log('✅ Default template frames added')

    // Test by querying companies
    const result = await query('SELECT COUNT(*) as count FROM companies')
    console.log(`✅ Test query successful - Found ${result.rows[0].count} companies`)

    console.log('\n🎉 Supabase setup complete!')
    console.log('Your HVAC platform is now connected to Supabase!')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

createTables()