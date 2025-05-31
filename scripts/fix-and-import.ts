import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jKkcxEWyD0l5@ep-lively-waterfall-a63ppdko.us-west-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
})

async function fixDatabase() {
  const client = await pool.connect()
  
  try {
    // Add missing columns
    await client.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0')
    console.log('✅ Added review_count column')
    
    // Check what we have now
    const result = await client.query('SELECT COUNT(*) as count, AVG(rating) as avg_rating FROM companies WHERE rating IS NOT NULL')
    console.log(`📊 Database status: ${result.rows[0].count} companies, average rating: ${parseFloat(result.rows[0].avg_rating).toFixed(1)}`)
    
    // Show sample data
    const sample = await client.query('SELECT name, city, state, rating, phone FROM companies WHERE rating >= 4.8 LIMIT 10')
    console.log('\n⭐ Sample high-rated companies:')
    sample.rows.forEach(company => {
      console.log(`  ${company.name} (${company.city || 'Unknown'}, ${company.state || 'Unknown'}) - ${company.rating}⭐ ${company.phone || 'No phone'}`)
    })
    
    console.log('\n✅ Your HVAC database is ready!')
    console.log('🚀 You can now test your templates with real business data!')
    
  } catch (error) {
    console.error('❌ Failed:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

fixDatabase()