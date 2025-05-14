import { query } from '../lib/db-simple';

async function main() {
  try {
    console.log('Creating frames tables in Replit PostgreSQL...');
    
    // First, check if the Replit database is properly connected
    console.log('\nChecking Replit database connection...');
    const dbInfo = await query('SELECT current_database() as db_name, version()');
    console.log('Connected to database:', dbInfo.rows[0].db_name);
    console.log('PostgreSQL version:', dbInfo.rows[0].version);
    
    // Create the frames table for template frames and company-specific frames
    console.log('\nCreating frames table for templates and companies...');
    await query(`
      CREATE TABLE IF NOT EXISTS frames (
        id SERIAL PRIMARY KEY,
        frame_name TEXT NOT NULL,
        image_url TEXT NOT NULL,
        template_key TEXT,
        company_id TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(frame_name, template_key, company_id)
      )
    `);
    console.log('Frames table created successfully');
    
    // Insert default template frames for ModernTrust template
    console.log('\nInserting default frames for ModernTrust template...');
    
    const modernTrustFrames = [
      {
        frame_name: 'hero_img',
        image_url: 'https://media.istockphoto.com/id/2154707821/photo/air-conditioner-service-the-air-conditioner-technician-is-using-a-gauge-to-measure-the.jpg?s=612x612&w=0&k=20&c=I-EvZdWGrPOTJcmFUYqCohZ3raVYnV-QFhS2CBiCI8Q=',
        template_key: 'moderntrust'
      },
      {
        frame_name: 'about_img',
        image_url: 'https://media.istockphoto.com/id/1432482642/photo/air-conditioner-worker-in-blue-uniform-examining-the-air-conditioner-indoor-unit-copy-space.jpg?s=612x612&w=0&k=20&c=PsLEvBFUfcTFX7rMCqaElnI8_cNXlRO7AfNMePsJSuA=',
        template_key: 'moderntrust'
      }
    ];
    
    for (const frame of modernTrustFrames) {
      try {
        console.log(`Inserting ${frame.frame_name} for ${frame.template_key}...`);
        await query(`
          INSERT INTO frames (frame_name, image_url, template_key)
          VALUES ($1, $2, $3)
          ON CONFLICT (frame_name, template_key, company_id) 
          DO UPDATE SET image_url = $2, updated_at = NOW()
        `, [frame.frame_name, frame.image_url, frame.template_key]);
      } catch (err) {
        console.error(`Error inserting frame ${frame.frame_name}:`, err);
      }
    }
    
    // Insert default template frames for BoldEnergy template
    console.log('\nInserting default frames for BoldEnergy template...');
    
    const boldEnergyFrames = [
      {
        frame_name: 'hero_img',
        image_url: 'https://media.istockphoto.com/id/1215295367/photo/technician-service-checking-air-conditioner.jpg?s=612x612&w=0&k=20&c=nENXvkdKMuiDeqJRHZoIEBKOjMWItZs9Mf8wt1B8rrA=',
        template_key: 'boldenergy'
      },
      {
        frame_name: 'about_img',
        image_url: 'https://media.istockphoto.com/id/1432154443/photo/air-conditioner-cleaning-service-male-electrician-cleaning-parts-of-air-conditioner.jpg?s=612x612&w=0&k=20&c=4mXNGkCxVYNSQXpZ2eiA-nTlHAfnbHfDxpn4xm8mj_E=',
        template_key: 'boldenergy'
      }
    ];
    
    for (const frame of boldEnergyFrames) {
      try {
        console.log(`Inserting ${frame.frame_name} for ${frame.template_key}...`);
        await query(`
          INSERT INTO frames (frame_name, image_url, template_key)
          VALUES ($1, $2, $3)
          ON CONFLICT (frame_name, template_key, company_id) 
          DO UPDATE SET image_url = $2, updated_at = NOW()
        `, [frame.frame_name, frame.image_url, frame.template_key]);
      } catch (err) {
        console.error(`Error inserting frame ${frame.frame_name}:`, err);
      }
    }
    
    // Verify the inserted frames
    const framesResult = await query('SELECT * FROM frames');
    console.log(`\nSuccessfully inserted ${framesResult.rows.length} frames:`);
    framesResult.rows.forEach((frame: any) => {
      console.log(`- ${frame.frame_name} for ${frame.template_key || 'company ' + frame.company_id}: ${frame.image_url.substring(0, 50)}...`);
    });
    
    console.log('\nFrames tables setup completed successfully!');
    
  } catch (err: any) {
    console.error('Setup failed:', err.message);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();