import { sql } from '../lib/db';

async function main() {
  try {
    console.log('Checking connection to Replit PostgreSQL database...');
    
    // Test query to verify connection
    const result = await sql`SELECT current_database() as db_name, current_user, version()`;
    
    if (result && result.length > 0) {
      console.log('Connection successful!');
      console.log('Database name:', result[0].db_name);
      console.log('Current user:', result[0].current_user);
      console.log('PostgreSQL version:', result[0].version);
    } else {
      console.log('Connected but received empty result');
    }
    
    // Check if any tables exist
    const tablesResult = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    
    if (tablesResult && tablesResult.length > 0) {
      console.log('\nExisting tables:');
      tablesResult.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('\nNo tables found in the public schema.');
    }
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    process.exit(0);
  }
}

main();