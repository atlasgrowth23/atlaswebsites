import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jKkcxEWyD0l5@ep-lively-waterfall-a63ppdko.us-west-2.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
})

async function addFrames() {
  console.log('🚀 Adding default template frames...')
  
  try {
    const client = await pool.connect()
    
    // Insert default template frames (without description column)
    await client.query(`
      INSERT INTO frames (slug, template_key, default_url) VALUES
        ('hero_img', 'moderntrust', '/images/hvac-hero-bg.jpg'),
        ('hero_img_2', 'moderntrust', '/images/hvac-hero-bg.svg'),
        ('about_img', 'moderntrust', '/images/default-hero.jpg')
      ON CONFLICT (slug, template_key) DO NOTHING
    `)
    console.log('✅ Default template frames added')

    // Test the setup
    const companiesResult = await client.query('SELECT COUNT(*) as count FROM companies')
    const framesResult = await client.query('SELECT COUNT(*) as count FROM frames')
    
    console.log(`✅ Found ${companiesResult.rows[0].count} companies`)
    console.log(`✅ Found ${framesResult.rows[0].count} template frames`)

    client.release()
    console.log('\n🎉 Setup complete! Your HVAC platform is ready!')

  } catch (error) {
    console.error('❌ Failed:', error)
  } finally {
    await pool.end()
  }
}

addFrames()