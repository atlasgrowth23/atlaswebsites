// Add tracking_enabled column to companies table
const { Client } = require('pg');

async function addTrackingColumn() {
  const client = new Client({
    connectionString: 'postgresql://postgres.zjxvacezqbhyomrngynq:eMeQW9s85usvbaok@aws-0-us-east-2.pooler.supabase.com:5432/postgres'
  });

  try {
    console.log('🔧 Adding tracking_enabled column to companies table...');
    await client.connect();

    // Add the column if it doesn't exist
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS tracking_enabled BOOLEAN DEFAULT false;
    `);

    console.log('✅ tracking_enabled column added to companies table');

    // Create an index for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_companies_tracking_enabled 
      ON companies(tracking_enabled);
    `);

    console.log('✅ Index created for tracking_enabled column');

    console.log('\n🎉 Tracking column setup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

addTrackingColumn();