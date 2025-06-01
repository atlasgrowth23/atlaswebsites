const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupStorageStructure() {
  console.log('🔧 Setting up storage structure and fixing database...');
  
  try {
    // Step 1: Fix frames table with correct paths (no /storage/ prefix)
    console.log('\n📝 Step 1: Fixing frames table...');
    
    // Delete existing frames first to avoid conflicts
    const { error: deleteError } = await supabase
      .from('frames')
      .delete()
      .eq('template_key', 'moderntrust');
    
    if (deleteError) {
      console.error('❌ Error deleting old frames:', deleteError);
    } else {
      console.log('✅ Cleared existing moderntrust frames');
    }
    
    // Insert correct frame definitions
    const { error: framesError } = await supabase
      .from('frames')
      .insert([
        {
          slug: 'hero_img',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/hero.jpg',
          description: 'ModernTrust hero background image'
        },
        {
          slug: 'hero_img_2',
          template_key: 'moderntrust', 
          default_url: '/templates/moderntrust/about.jpg',
          description: 'ModernTrust second hero background image'
        },
        {
          slug: 'about_img',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/about.jpg',
          description: 'ModernTrust about section background image'
        },
        {
          slug: 'logo_url',
          template_key: 'moderntrust',
          default_url: '/templates/moderntrust/default-logo.svg',
          description: 'ModernTrust default logo fallback'
        }
      ]);

    if (framesError) {
      console.error('❌ Error creating frames:', framesError);
    } else {
      console.log('✅ Created moderntrust frames with correct paths');
    }

    // Step 2: Check/create storage buckets
    console.log('\n📁 Step 2: Setting up storage buckets...');
    
    // List existing buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
      return;
    }
    
    console.log('📋 Existing buckets:', buckets.map(b => b.name));
    
    // Check if images bucket exists
    const imagesBucket = buckets.find(b => b.name === 'images');
    if (!imagesBucket) {
      console.log('🆕 Creating images bucket...');
      const { error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating images bucket:', createError);
      } else {
        console.log('✅ Created images bucket');
      }
    } else {
      console.log('✅ Images bucket already exists');
    }

    // Step 3: Create folder structure by uploading placeholder files
    console.log('\n📂 Step 3: Creating folder structure...');
    
    // Create templates/moderntrust/ folder
    const placeholderContent = 'placeholder';
    const { error: templateFolderError } = await supabase.storage
      .from('images')
      .upload('templates/moderntrust/.gitkeep', placeholderContent, {
        contentType: 'text/plain'
      });
    
    if (templateFolderError && !templateFolderError.message.includes('already exists')) {
      console.error('❌ Error creating templates folder:', templateFolderError);
    } else {
      console.log('✅ Created /templates/moderntrust/ folder');
    }
    
    // Create logos/ folder
    const { error: logosFolderError } = await supabase.storage
      .from('images')
      .upload('logos/.gitkeep', placeholderContent, {
        contentType: 'text/plain'
      });
    
    if (logosFolderError && !logosFolderError.message.includes('already exists')) {
      console.error('❌ Error creating logos folder:', logosFolderError);
    } else {
      console.log('✅ Created /logos/ folder');
    }

    // Step 4: Test URL generation
    console.log('\n🧪 Step 4: Testing URL generation...');
    
    const testPaths = [
      '/templates/moderntrust/hero.jpg',
      '/templates/moderntrust/about.jpg', 
      '/templates/moderntrust/default-logo.svg',
      '/logos/test-company.png'
    ];
    
    for (const path of testPaths) {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(path);
      
      console.log(`📍 ${path} -> ${data.publicUrl}`);
    }

    // Step 5: Verify frames in database
    console.log('\n🔍 Step 5: Verifying database frames...');
    
    const { data: frames } = await supabase
      .from('frames')
      .select('*')
      .eq('template_key', 'moderntrust');

    console.log('📋 Current frames:');
    frames?.forEach(frame => {
      const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images${frame.default_url}`;
      console.log(`  - ${frame.slug}: ${fullUrl}`);
    });

    console.log('\n✅ Storage structure setup complete!');
    console.log('🎯 Next: Upload template images to these paths');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupStorageStructure();