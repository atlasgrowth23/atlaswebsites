import { query } from '../lib/db-simple';

async function main() {
  try {
    console.log('Updating frame images to test if changes are detected...');
    
    // Check connection
    const dbInfo = await query('SELECT current_database() as db_name');
    console.log('Connected to database:', dbInfo.rows[0].db_name);
    
    // Get current frames
    const currentFrames = await query('SELECT * FROM frames');
    console.log(`Found ${currentFrames.rows.length} frames in the database.`);
    
    // New image URLs - using different images
    const newHeroImage = 'https://images.unsplash.com/photo-1581146783519-13333b79e6c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80';
    const newAboutImage = 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80';
    
    // Update ModernTrust template frames
    console.log('\nUpdating ModernTrust template frames...');
    await query(`
      UPDATE frames 
      SET image_url = $1, updated_at = NOW() 
      WHERE template_key = 'moderntrust' AND frame_name = 'hero_img'
    `, [newHeroImage]);
    
    await query(`
      UPDATE frames 
      SET image_url = $1, updated_at = NOW() 
      WHERE template_key = 'moderntrust' AND frame_name = 'about_img'
    `, [newAboutImage]);
    
    // Update BoldEnergy template frames
    console.log('\nUpdating BoldEnergy template frames...');
    await query(`
      UPDATE frames 
      SET image_url = $1, updated_at = NOW() 
      WHERE template_key = 'boldenergy' AND frame_name = 'hero_img'
    `, [newHeroImage]);
    
    await query(`
      UPDATE frames 
      SET image_url = $1, updated_at = NOW() 
      WHERE template_key = 'boldenergy' AND frame_name = 'about_img'
    `, [newAboutImage]);
    
    // Verify the updated frames
    const updatedFrames = await query('SELECT * FROM frames');
    console.log('\nUpdated frames:');
    updatedFrames.rows.forEach((frame: any) => {
      console.log(`- ${frame.frame_name} for ${frame.template_key || 'company ' + frame.company_id}: ${frame.image_url.substring(0, 75)}...`);
    });
    
    console.log('\nSuccessfully updated frame images. Try refreshing the page and see if they change.');
    console.log('If they don\'t change, you may need to restart the Next.js dev server or clear the ISR cache.');
    
  } catch (err: any) {
    console.error('Error updating frame images:', err.message);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();