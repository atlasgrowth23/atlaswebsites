// Fix missing company_id in hvac_contact_activities table
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixHVACActivitiesCompany() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }

  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing hvac_contact_activities table...');
    
    // Add company_id column
    console.log('📋 Adding company_id column...');
    await client.query(`
      ALTER TABLE hvac_contact_activities 
      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
    `);
    
    // Update existing records to have company_id from their contact
    console.log('📊 Updating existing records with company_id...');
    await client.query(`
      UPDATE hvac_contact_activities 
      SET company_id = (
        SELECT hc.company_id 
        FROM hvac_contacts hc 
        WHERE hc.id = hvac_contact_activities.contact_id
      )
      WHERE company_id IS NULL;
    `);
    
    // Make company_id NOT NULL
    console.log('🔒 Making company_id NOT NULL...');
    await client.query(`
      ALTER TABLE hvac_contact_activities 
      ALTER COLUMN company_id SET NOT NULL;
    `);
    
    // Add index for performance
    console.log('🚀 Adding performance index...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hvac_contact_activities_company_id 
      ON hvac_contact_activities(company_id);
    `);
    
    // Update RLS policy to use company_id directly
    console.log('🛡️ Updating RLS policy...');
    await client.query(`
      DROP POLICY IF EXISTS hvac_contact_activities_company_access ON hvac_contact_activities;
      
      CREATE POLICY hvac_contact_activities_company_access ON hvac_contact_activities
        FOR ALL TO authenticated
        USING (company_id IN (
          SELECT c.id FROM companies c 
          WHERE c.email_1 = auth.jwt() ->> 'email'
        ));
    `);
    
    console.log('✅ hvac_contact_activities table fixed!');
    console.log('✅ company_id column added and populated');
    console.log('✅ RLS policy updated');
    console.log('✅ Performance index created');
    
  } catch (error) {
    console.error('❌ Fix error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixHVACActivitiesCompany().catch(error => {
  console.error('Fix failed:', error.message);
  process.exit(1);
});