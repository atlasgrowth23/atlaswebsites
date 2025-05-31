import { Pool } from 'pg'

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jKkcxEWyD0l5@ep-lively-waterfall-a63ppdko.us-west-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
})

async function addEmailColumn() {
  const client = await pool.connect()
  
  try {
    // Add email column
    await client.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS email TEXT')
    console.log('✅ Added email column')
    
    // Also add website column since the import needs it
    await client.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS website TEXT')
    console.log('✅ Added website column')
    
    // Add address column
    await client.query('ALTER TABLE companies ADD COLUMN IF NOT EXISTS address TEXT')
    console.log('✅ Added address column')
    
    console.log('✅ Database updated! Ready for import.')
    
  } catch (error) {
    console.error('❌ Failed:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

addEmailColumn()