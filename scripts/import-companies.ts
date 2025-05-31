import { Pool } from 'pg'
import * as fs from 'fs'
import csv from 'csv-parser'

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jKkcxEWyD0l5@ep-lively-waterfall-a63ppdko.us-west-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
})

interface CSVCompany {
  id: string
  slug: string
  name: string
  phone: string
  email_1: string
  site: string
  street: string
  city: string
  state: string
  postal_code: string
  rating: string
  reviews: string
  working_hours: string
  logo: string
  emergency_service?: string
}

async function importCompanies() {
  console.log('🚀 Importing HVAC companies from CSV...')
  
  const client = await pool.connect()
  const companies: CSVCompany[] = []
  
  try {
    // Read CSV file
    const csvPath = '/home/runner/workspace/CompanyData/combined_filtered_hvac.csv'
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data: CSVCompany) => companies.push(data))
        .on('end', resolve)
        .on('error', reject)
    })
    
    console.log(`📄 Found ${companies.length} companies in CSV`)
    
    let imported = 0
    let skipped = 0
    
    for (const company of companies) {
      try {
        // Parse working hours (might be JSON)
        let hours = null
        try {
          if (company.working_hours && company.working_hours.trim()) {
            const parsed = JSON.parse(company.working_hours)
            // Convert to simple format: "Mon-Fri: 8AM-5PM"
            hours = Object.entries(parsed).map(([day, time]) => `${day}: ${time}`).join(', ')
          }
        } catch (e) {
          hours = company.working_hours // Keep as-is if not JSON
        }
        
        // Determine emergency service
        const emergency_service = company.emergency_service === 'true' || 
                                 (hours && hours.toLowerCase().includes('24 hours'))
        
        // Insert company
        await client.query(`
          INSERT INTO companies (
            id, slug, name, phone, email, website, address, city, state, postal_code,
            rating, review_count, logo, emergency_service, hours, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
          ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            email = EXCLUDED.email,
            website = EXCLUDED.website,
            address = EXCLUDED.address,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            postal_code = EXCLUDED.postal_code,
            rating = EXCLUDED.rating,
            review_count = EXCLUDED.review_count,
            logo = EXCLUDED.logo,
            emergency_service = EXCLUDED.emergency_service,
            hours = EXCLUDED.hours,
            updated_at = NOW()
        `, [
          company.id || null,
          company.slug,
          company.name,
          company.phone,
          company.email_1 || null,
          company.site || null,
          company.street || null,
          company.city,
          company.state,
          company.postal_code || null,
          company.rating ? parseFloat(company.rating) : null,
          company.reviews ? parseInt(company.reviews) : 0,
          company.logo || null,
          emergency_service,
          hours,
        ])
        
        imported++
        if (imported % 10 === 0) {
          console.log(`📊 Imported ${imported} companies...`)
        }
        
      } catch (error) {
        console.log(`⚠️  Skipped ${company.name}: ${error.message}`)
        skipped++
      }
    }
    
    console.log(`\n✅ Import complete!`)
    console.log(`📊 Imported: ${imported} companies`)
    console.log(`⚠️  Skipped: ${skipped} companies`)
    
    // Test query
    const result = await client.query('SELECT COUNT(*) as count FROM companies')
    console.log(`🎉 Total companies in database: ${result.rows[0].count}`)
    
    // Show some examples
    const examples = await client.query('SELECT name, city, state, rating FROM companies ORDER BY rating DESC LIMIT 5')
    console.log('\n⭐ Top 5 rated companies:')
    examples.rows.forEach(company => {
      console.log(`  ${company.name} (${company.city}, ${company.state}) - ${company.rating}⭐`)
    })
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

importCompanies()