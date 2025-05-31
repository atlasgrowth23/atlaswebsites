import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jKkcxEWyD0l5@ep-lively-waterfall-a63ppdko.us-west-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
})

async function testTemplate() {
  const client = await pool.connect()
  
  try {
    // Get a company with a good slug for testing
    const result = await client.query(`
      SELECT id, name, slug, phone, email, city, state, rating, logo, website
      FROM companies 
      WHERE slug IS NOT NULL 
        AND slug != '' 
        AND rating >= 4.5
        AND phone IS NOT NULL
      ORDER BY rating DESC 
      LIMIT 5
    `)
    
    console.log('🧪 Template Test Results:')
    console.log('='.repeat(50))
    
    if (result.rows.length === 0) {
      console.log('❌ No companies with slugs found')
      return
    }
    
    result.rows.forEach((company, index) => {
      console.log(`\n${index + 1}. ${company.name}`)
      console.log(`   Rating: ${company.rating}⭐`)
      console.log(`   Location: ${company.city || 'Unknown'}, ${company.state || 'Unknown'}`)
      console.log(`   Phone: ${company.phone}`)
      console.log(`   Template URL: /t/moderntrust/${company.slug}`)
      console.log(`   Slug: ${company.slug}`)
      
      if (index === 0) {
        console.log(`\n🎯 RECOMMENDED TEST URL:`)
        console.log(`   http://localhost:5000/t/moderntrust/${company.slug}`)
      }
    })
    
    console.log('\n✅ Your templates should work with these companies!')
    console.log('🚀 Start your dev server with: npm run dev')
    console.log('   Then visit the URL above to see the ModernTrust template')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

testTemplate()