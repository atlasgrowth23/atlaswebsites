const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTkContactsTable() {
  if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
    throw new Error('DIRECT_URL or DATABASE_URL missing in env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating tk_contacts table...');
    
    // Create tk_contacts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS tk_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        owner_name VARCHAR(255),
        owner_email VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_tk_contacts_company 
          FOREIGN KEY (company_id) 
          REFERENCES companies(id) 
          ON DELETE CASCADE
      );
    `);
    console.log('✓ Created tk_contacts table');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tk_contacts_company_id 
      ON tk_contacts(company_id);
    `);
    console.log('✓ Created index on company_id');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_tk_contacts_owner_email 
      ON tk_contacts(owner_email);
    `);
    console.log('✓ Created index on owner_email');
    
    // Enable Row Level Security
    await client.query(`
      ALTER TABLE tk_contacts ENABLE ROW LEVEL SECURITY;
    `);
    console.log('✓ Enabled RLS on tk_contacts');
    
    // Create RLS policy for authenticated users
    await client.query(`
      DROP POLICY IF EXISTS "tk_contacts_policy" ON tk_contacts;
      CREATE POLICY "tk_contacts_policy" ON tk_contacts
        FOR ALL TO authenticated
        USING (true);
    `);
    console.log('✓ Created RLS policy for tk_contacts');
    
    console.log('🎉 Successfully created tk_contacts table with indexes and RLS');
    
  } catch (error) {
    console.error('❌ Error creating tk_contacts table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTkContactsTable().catch(error => {
  console.error('Migration failed:', error.message);
  process.exit(1);
});