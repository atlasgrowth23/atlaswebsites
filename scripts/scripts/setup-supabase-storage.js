const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Need service role key for admin operations
);

async function setupSupabaseStorage() {
  try {
    console.log('🚀 Setting up Supabase Storage for AtlasHVAC...');
    
    const bucketName = 'atlashvac-equipment-photos';
    
    // Check if bucket already exists
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw listError;
    }
    
    const bucketExists = existingBuckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log('✓ Bucket already exists:', bucketName);
    } else {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make photos publicly accessible
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB limit
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        throw error;
      }
      
      console.log('✓ Created bucket:', bucketName);
    }
    
    // Set up bucket policies (RLS for tenant isolation)
    console.log('📝 Setting up bucket policies...');
    
    // Note: In a real implementation, you'd want to set up RLS policies
    // to ensure users can only access photos for their tenant
    // This requires additional Supabase configuration
    
    console.log('✅ Supabase Storage setup completed successfully');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up Row Level Security policies in Supabase dashboard');
    console.log('2. Configure tenant-based access policies for the storage bucket');
    console.log('3. Test photo upload functionality');
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error.message);
    throw error;
  }
}

setupSupabaseStorage().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});