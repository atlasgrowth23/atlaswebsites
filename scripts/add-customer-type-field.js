const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function addCustomerTypeField() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL missing in .env.local');
  }
  
  const client = await pool.connect();
  
  try {
    console.log('🚀 Adding customer_type field to atlashvac_contacts...');
    
    // Add customer_type column with constraint
    await client.query(`
      ALTER TABLE atlashvac_contacts 
      ADD COLUMN IF NOT EXISTS customer_type TEXT 
      CHECK (customer_type IN ('Residential', 'Commercial', 'Industrial'));
    `);
    
    console.log('✓ Added customer_type column with constraint');
    
    // Update existing contacts with appropriate customer types based on their equipment
    console.log('📝 Updating existing contacts with customer types...');
    
    // Get company ID
    const companyResult = await client.query(`
      SELECT id FROM companies WHERE slug = 'ready-heating-and-air-llc' LIMIT 1
    `);
    
    if (companyResult.rows.length === 0) {
      throw new Error('Company not found');
    }
    
    const companyId = companyResult.rows[0].id;
    
    // Update each contact based on their equipment
    // Sandy Sanders - Residential (has Split AC + Furnace)
    await client.query(`
      UPDATE atlashvac_contacts 
      SET customer_type = 'Residential'
      WHERE tenant_id = $1 AND first_name = 'Sandy' AND last_name = 'Sanders'
    `, [companyId]);
    
    // Judith Harrison - Residential (has Heat Pump)
    await client.query(`
      UPDATE atlashvac_contacts 
      SET customer_type = 'Residential'
      WHERE tenant_id = $1 AND first_name = 'Judith' AND last_name = 'Harrison'
    `, [companyId]);
    
    // Mark Johnson - Commercial (has Rooftop Unit)
    await client.query(`
      UPDATE atlashvac_contacts 
      SET customer_type = 'Commercial'
      WHERE tenant_id = $1 AND first_name = 'Mark' AND last_name = 'Johnson'
    `, [companyId]);
    
    console.log('✓ Updated existing contacts with customer types');
    
    // Verify the updates
    const updatedContacts = await client.query(`
      SELECT first_name, last_name, customer_type 
      FROM atlashvac_contacts 
      WHERE tenant_id = $1
      ORDER BY first_name
    `, [companyId]);
    
    console.log('\n📊 Updated Contacts:');
    updatedContacts.rows.forEach(contact => {
      console.log(`  ${contact.first_name} ${contact.last_name}: ${contact.customer_type}`);
    });
    
    console.log('\n✅ Customer type field added successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addCustomerTypeField().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});