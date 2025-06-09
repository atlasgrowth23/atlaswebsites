const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: 'env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function uploadEmailLogo() {
  try {
    console.log('📤 Uploading email logo to Supabase Storage...');
    
    const imagePath = path.join(__dirname, '..', 'IMG_3843.jpeg');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ IMG_3843.jpeg not found in workspace root');
      return;
    }
    
    const fileBuffer = fs.readFileSync(imagePath);
    const fileName = 'email-assets/atlas-logo.jpeg';
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true // Replace if exists
      });
    
    if (error) {
      console.error('❌ Upload error:', error);
      return;
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(fileName);
    
    console.log('✅ Logo uploaded successfully!');
    console.log('📎 Public URL:', publicUrlData.publicUrl);
    console.log('🎯 Ready for email templates');
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

uploadEmailLogo();