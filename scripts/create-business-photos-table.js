const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createBusinessPhotosTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating business_photos table for photo library...\n');
    
    // Create business_photos table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS business_photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
        original_url TEXT NOT NULL,
        storage_url TEXT,
        photo_type TEXT, -- 'storefront', 'team', 'equipment', 'interior', 'other'
        quality_score FLOAT DEFAULT 0,
        claude_analysis JSONB DEFAULT '{}',
        width INTEGER,
        height INTEGER,
        file_size INTEGER,
        extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        analyzed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    await client.query(createTableQuery);
    console.log('✅ Created business_photos table');
    
    // Create indexes for performance
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_business_photos_company_id ON business_photos(company_id);',
      'CREATE INDEX IF NOT EXISTS idx_business_photos_photo_type ON business_photos(photo_type);',
      'CREATE INDEX IF NOT EXISTS idx_business_photos_quality_score ON business_photos(quality_score DESC);',
      'CREATE INDEX IF NOT EXISTS idx_business_photos_extracted_at ON business_photos(extracted_at DESC);'
    ];
    
    for (const indexQuery of indexQueries) {
      await client.query(indexQuery);
    }
    console.log('✅ Created performance indexes');
    
    // Check table structure
    const structureQuery = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'business_photos'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 business_photos table structure:');
    structureQuery.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n🎯 Ready for photo extraction testing!');
    
  } catch (error) {
    console.error('❌ Error creating table:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createBusinessPhotosTable().catch(console.error);