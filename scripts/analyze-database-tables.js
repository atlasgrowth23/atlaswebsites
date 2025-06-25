const { Client } = require('pg');

async function analyzeDatabaseTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔍 Connected to database, analyzing tables...\n');

    // Get all tables in public schema
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.table_name);
    
    console.log(`📊 Found ${tables.length} tables:\n`);

    // Get row count for each table
    for (const tableName of tables) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
        const countResult = await client.query(countQuery);
        const rowCount = parseInt(countResult.rows[0].count);
        
        const status = rowCount === 0 ? '🟡 EMPTY' : rowCount < 10 ? '🟢 FEW' : '🔵 MANY';
        console.log(`${status} ${tableName.padEnd(35)} ${rowCount.toLocaleString().padStart(8)} rows`);
      } catch (error) {
        console.log(`❌ ${tableName.padEnd(35)} ERROR: ${error.message.split('\n')[0]}`);
      }
    }

    console.log('\n📋 Analysis Summary:');
    console.log('🟡 EMPTY = 0 rows (safe to delete)');
    console.log('🟢 FEW = 1-9 rows (likely test data)');
    console.log('🔵 MANY = 10+ rows (production data)');
    console.log('❌ ERROR = Permission or other issues');

  } catch (error) {
    console.error('❌ Database connection error:', error.message);
  } finally {
    await client.end();
  }
}

// Add this to package.json check
const fs = require('fs');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  if (!packageJson.dependencies.pg) {
    console.log('⚠️  Installing pg dependency...');
    require('child_process').execSync('npm install pg', { stdio: 'inherit' });
  }
} catch (error) {
  console.log('⚠️  Please run: npm install pg');
  process.exit(1);
}

analyzeDatabaseTables().catch(console.error);