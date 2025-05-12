import { query } from '../lib/db-simple';

async function main() {
  try {
    console.log('Testing database connection...');
    
    // Test query
    const result = await query('SELECT current_database() as db_name, version()');
    console.log('Connection successful!');
    console.log('Database:', result.rows[0].db_name);
    console.log('Version:', result.rows[0].version);
    
    // Create a test table
    console.log('\nCreating test table...');
    await query(`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Test table created');
    
    // Insert data
    console.log('\nInserting test data...');
    await query(
      'INSERT INTO test_table (name) VALUES ($1), ($2), ($3)',
      ['Test 1', 'Test 2', 'Test 3']
    );
    console.log('Test data inserted');
    
    // Query data
    console.log('\nQuerying test data...');
    const dataResult = await query('SELECT * FROM test_table');
    console.log(`Found ${dataResult.rows.length} rows:`);
    dataResult.rows.forEach(row => {
      console.log(`- ${row.id}: ${row.name} (${row.created_at})`);
    });
    
    console.log('\nDatabase test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

main();