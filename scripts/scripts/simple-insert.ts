import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jKkcxEWyD0l5@ep-lively-waterfall-a63ppdko.us-west-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
})

async function insertFrames() {
  console.log('🚀 Adding default frames...')
  
  const client = await pool.connect()
  
  try {
    // Simple insert
    await client.query(`
      INSERT INTO frames (slug, template_key, default_url) VALUES 
      ('hero_img', 'moderntrust', '/images/hvac-hero-bg.jpg')
    `)
    
    await client.query(`
      INSERT INTO frames (slug, template_key, default_url) VALUES 
      ('hero_img_2', 'moderntrust', '/images/hvac-hero-bg.svg')
    `)
    
    await client.query(`
      INSERT INTO frames (slug, template_key, default_url) VALUES 
      ('about_img', 'moderntrust', '/images/default-hero.jpg')
    `)
    
    console.log('✅ Frames added')
    
    const result = await client.query('SELECT COUNT(*) FROM frames')
    console.log(`Found ${result.rows[0].count} frames`)
    
  } catch (error) {
    console.log('Error:', error.message)
  } finally {
    client.release()
    await pool.end()
  }
}

insertFrames()