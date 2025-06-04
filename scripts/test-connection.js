const { Pool } = require('pg');

// Test both connection strings
const connections = [
  {
    name: "DATABASE_URL (pgbouncer)",
    connectionString: "postgresql://postgres.zjxvacezqbhyomrngynq:Kpm7izZEPQgyXpWY@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
  },
  {
    name: "DIRECT_URL", 
    connectionString: "postgresql://postgres.zjxvacezqbhyomrngynq:Kpm7izZEPQgyXpWY@aws-0-us-east-2.pooler.supabase.com:5432/postgres"
  }
];

async function testConnection(config) {
  console.log(`\n🔍 Testing ${config.name}...`);
  
  const pool = new Pool({
    connectionString: config.connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Test basic connection
    const result = await pool.query('SELECT NOW() as current_time');
    console.log(`✅ Connection successful! Time: ${result.rows[0].current_time}`);
    
    // List tables
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`📋 Found ${tables.rows.length} tables:`);
    tables.rows.forEach(row => console.log(`  - ${row.table_name}`));
    
    // Check if template_views exists and has data
    try {
      const viewsCount = await pool.query('SELECT COUNT(*) as count FROM template_views');
      console.log(`📊 template_views has ${viewsCount.rows[0].count} records`);
      
      // Check existing indexes on template_views
      const indexes = await pool.query(`
        SELECT indexname, indexdef 
        FROM pg_indexes 
        WHERE tablename = 'template_views'
      `);
      console.log(`🔍 template_views has ${indexes.rows.length} indexes:`);
      indexes.rows.forEach(row => console.log(`  - ${row.indexname}`));
      
    } catch (err) {
      console.log(`❌ template_views error: ${err.message}`);
    }
    
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
  } finally {
    await pool.end();
  }
}

async function runTests() {
  for (const config of connections) {
    await testConnection(config);
  }
}

runTests().catch(console.error);