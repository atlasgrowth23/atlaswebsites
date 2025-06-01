const { Client } = require('pg');

async function testConnection() {
  // Use the URL directly to avoid shell variable issues
  const connectionString = 'postgresql://postgres.zjxvacezqbhyomrngynq:Matheos23$Who@aws-0-us-east-2.pooler.supabase.com:6543/postgres';
  
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Test query to see companies
    const result = await client.query('SELECT COUNT(*) as count FROM companies');
    console.log(`📊 Found ${result.rows[0].count} companies in database`);

    // Check if our new tables exist
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('company_frames', 'frames')
    `);
    console.log('📋 New tables found:', tablesCheck.rows.map(r => r.table_name));

    // Check frames table content
    if (tablesCheck.rows.some(r => r.table_name === 'frames')) {
      const framesCount = await client.query('SELECT COUNT(*) as count FROM frames');
      console.log(`🖼️ Found ${framesCount.rows[0].count} template frames`);
    }

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.end();
  }
}

testConnection();