import { createClient } from '@supabase/supabase-js'

// Direct setup with your credentials
const supabaseUrl = 'https://zjxvacezqbhyomrngynq.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpqeHZhY2V6cWJoeW9tcm5neW5xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODYzOTg2NCwiZXhwIjoyMDY0MjE1ODY0fQ.1dbOL9c54yChzqziz7BNTh-JLs4jQRomw18XhQJP_bs'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupTables() {
  console.log('🚀 Setting up Supabase tables...')
  
  try {
    // Create companies table
    console.log('Creating companies table...')
    const { error: companiesError } = await supabase.rpc('exec', {
      sql: `
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
        );
      `
    })

    if (companiesError) {
      console.log('Companies table result:', companiesError.message)
    } else {
      console.log('✅ Companies table ready')
    }

    // Create company_frames table
    console.log('Creating company_frames table...')
    const { error: framesError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS company_frames (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
          slug TEXT NOT NULL,
          url TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(company_id, slug)
        );
      `
    })

    if (framesError) {
      console.log('Company frames table result:', framesError.message)
    } else {
      console.log('✅ Company frames table ready')
    }

    // Create template frames table
    console.log('Creating frames table...')
    const { error: templateError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS frames (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          slug TEXT NOT NULL,
          template_key TEXT NOT NULL,
          default_url TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(slug, template_key)
        );
      `
    })

    if (templateError) {
      console.log('Template frames table result:', templateError.message)
    } else {
      console.log('✅ Template frames table ready')
    }

    // Test basic functionality
    console.log('Testing basic functionality...')
    const { data: testData, error: testError } = await supabase
      .from('companies')
      .select('*')
      .limit(1)

    if (testError) {
      console.log('Test query error:', testError)
    } else {
      console.log('✅ Basic queries working')
      console.log(`Found ${testData?.length || 0} companies`)
    }

    // Insert some default template frames
    console.log('Adding default template frames...')
    const { error: insertError } = await supabase
      .from('frames')
      .upsert([
        {
          slug: 'hero_img',
          template_key: 'moderntrust',
          default_url: '/images/hvac-hero-bg.jpg',
          description: 'Default hero background for ModernTrust template'
        },
        {
          slug: 'hero_img_2',
          template_key: 'moderntrust', 
          default_url: '/images/hvac-hero-bg.svg',
          description: 'Alternate hero background for ModernTrust template'
        },
        {
          slug: 'about_img',
          template_key: 'moderntrust',
          default_url: '/images/default-hero.jpg', 
          description: 'Default about section image for ModernTrust template'
        }
      ], { onConflict: 'slug,template_key' })

    if (insertError) {
      console.log('Insert frames error:', insertError)
    } else {
      console.log('✅ Default template frames added')
    }

    console.log('\n🎉 Supabase setup complete!')
    console.log('Your HVAC platform is now running on Supabase!')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupTables()