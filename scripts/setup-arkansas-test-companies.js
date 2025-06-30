const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const arkansasCompanies = [
  {
    name: 'Chill Factor Mechanical',
    slug: 'chill-factor-mechanical',
    phone: '+1 479-459-4566',
    city: 'Fort Smith',
    state: 'Arkansas',
    latitude: 35.3859,
    longitude: -94.3985,
    template_key: 'moderntrust',
    rating: 5.0,
    reviews: 1
  },
  {
    name: 'AirPro',
    slug: 'airpro',
    phone: '+1 479-601-0711',
    city: 'Arkansas',
    state: 'Arkansas',
    latitude: 35.2010,
    longitude: -91.8318,
    template_key: 'moderntrust',
    rating: 5.0,
    reviews: 34
  },
  {
    name: 'Hook Mechanical LLC',
    slug: 'hook-mechanical-llc',
    phone: '+1 479-200-6998',
    city: 'Huntsville',
    state: 'Arkansas',
    latitude: 36.0862,
    longitude: -93.7413,
    template_key: 'moderntrust',
    rating: 4.6,
    reviews: 27
  }
];

async function setupArkansasCompanies() {
  console.log('🏗️  Setting up Arkansas test companies...');

  for (const company of arkansasCompanies) {
    try {
      // Check if company already exists
      const { data: existing } = await supabase
        .from('companies')
        .select('id')
        .eq('slug', company.slug)
        .single();

      if (existing) {
        console.log(`✅ Company ${company.name} already exists`);
        continue;
      }

      // Create company
      const { data, error } = await supabase
        .from('companies')
        .insert([company])
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${company.name}:`, error);
        continue;
      }

      console.log(`✅ Created company: ${company.name} (ID: ${data.id})`);

      // Create default template frames
      const frames = [
        { slug: 'hero_img', default_url: '/stock/moderntrust/hero_img.svg' },
        { slug: 'about_img', default_url: '/stock/moderntrust/about_img.svg' }
      ];

      for (const frame of frames) {
        await supabase
          .from('company_frames')
          .insert([{
            company_id: data.id,
            slug: frame.slug,
            url: frame.default_url
          }]);
      }

      console.log(`✅ Created frames for ${company.name}`);

    } catch (error) {
      console.error(`❌ Error setting up ${company.name}:`, error);
    }
  }

  console.log('🎉 Arkansas test companies setup complete!');
}

setupArkansasCompanies();