import { query } from '../lib/db-simple';

async function main() {
  try {
    console.log('Creating message and user credential tables in Replit PostgreSQL...');
    
    // Connect to the database
    const dbInfo = await query('SELECT current_database() as db_name, version()');
    console.log('Connected to database:', dbInfo.rows[0].db_name);
    console.log('PostgreSQL version:', dbInfo.rows[0].version);
    
    // Create messages table
    console.log('\nCreating messages table...');
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        company_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        sender_email TEXT,
        sender_phone TEXT,
        message_content TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Messages table created successfully');
    
    // Create user_credentials table
    console.log('\nCreating user_credentials table...');
    await query(`
      CREATE TABLE IF NOT EXISTS user_credentials (
        id SERIAL PRIMARY KEY,
        business_slug TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP
      )
    `);
    console.log('User credentials table created successfully');
    
    // Create an index on company_id in the messages table for faster queries
    console.log('\nCreating index on company_id in messages table...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_messages_company_id ON messages(company_id)
    `);
    console.log('Index created successfully');
    
    // Verify the tables were created
    console.log('\nVerifying created tables:');
    const tablesResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND 
      table_name IN ('messages', 'user_credentials')
    `);
    
    if (tablesResult.rows.length === 2) {
      console.log('Both tables were created successfully!');
    } else {
      console.log('Tables found:', tablesResult.rows.map((r: any) => r.table_name).join(', '));
    }
    
    // Generate default credentials for each company
    console.log('\nGenerating default credentials for companies...');
    const companies = await query('SELECT id, name, slug FROM companies');
    
    for (const company of companies.rows) {
      try {
        // Generate a username based on company name (lowercase, no spaces)
        const username = company.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '') // Remove special characters and spaces
          .substring(0, 20); // Limit length
        
        // Generate a default password
        const defaultPassword = `hvac${Math.floor(1000 + Math.random() * 9000)}`; // e.g., hvac1234
        
        console.log(`Creating credentials for ${company.name} (${username}:${defaultPassword})`);
        
        // Insert into user_credentials table, skip if business_slug already exists
        await query(`
          INSERT INTO user_credentials (business_slug, username, password)
          VALUES ($1, $2, $3)
          ON CONFLICT (business_slug) DO NOTHING
        `, [company.slug, username, defaultPassword]);
      } catch (err) {
        console.error(`Error creating credentials for ${company.name}:`, err);
      }
    }
    
    // Count how many credentials were generated
    const credCount = await query('SELECT COUNT(*) as count FROM user_credentials');
    console.log(`\nGenerated ${credCount.rows[0].count} default user credentials`);
    
    console.log('\nDatabase setup completed successfully!');
    
  } catch (err: any) {
    console.error('Setup failed:', err.message);
  } finally {
    process.exit(0);
  }
}

// Run the script
main();