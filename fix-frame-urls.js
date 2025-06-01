const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixFrameUrls() {
  console.log('🔧 Fixing frame URLs...');

  try {
    // Update existing frames with correct paths (no leading /storage/)
    const { error: updateError } = await supabase
      .from('frames')
      .update({ default_url: '/templates/moderntrust/hero.jpg' })
      .eq('slug', 'hero_img')
      .eq('template_key', 'moderntrust');

    const { error: updateError2 } = await supabase
      .from('frames')
      .update({ default_url: '/templates/moderntrust/about.jpg' })
      .eq('slug', 'about_img')
      .eq('template_key', 'moderntrust');

    // Add missing hero_img_2
    const { error: insertError } = await supabase
      .from('frames')
      .insert({
        slug: 'hero_img_2',
        template_key: 'moderntrust',
        default_url: '/templates/moderntrust/about.jpg',
        description: 'ModernTrust second hero image'
      });

    if (insertError && !insertError.message.includes('already exists')) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Added hero_img_2 frame');
    }

    // Check final frame URLs
    const { data: frames } = await supabase
      .from('frames')
      .select('*')
      .eq('template_key', 'moderntrust');

    console.log('📋 Final frame URLs:');
    frames?.forEach(frame => {
      const fullUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images${frame.default_url}`;
      console.log(`  - ${frame.slug}: ${fullUrl}`);
    });

    console.log('✅ Frame URLs fixed!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixFrameUrls();