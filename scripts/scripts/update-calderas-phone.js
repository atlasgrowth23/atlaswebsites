const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateCalderasPhone() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Finding Calderas Heating and Air...');
    
    // Find Calderas company
    const { rows: companies } = await client.query(`
      SELECT id, name, phone FROM companies 
      WHERE name ILIKE '%calderas%' OR name ILIKE '%heating%air%'
      ORDER BY name
    `);
    
    console.log('Found companies:', companies);
    
    if (companies.length > 0) {
      const calderas = companies.find(c => c.name.toLowerCase().includes('calderas')) || companies[0];
      console.log(`📞 Updating phone for: ${calderas.name}`);
      console.log(`   Old phone: ${calderas.phone}`);
      
      // Update phone number
      await client.query(`
        UPDATE companies 
        SET phone = $1, updated_at = NOW()
        WHERE id = $2
      `, ['205-500-5170', calderas.id]);
      
      console.log('✅ Updated phone to: 205-500-5170');
      
      // Find lead for this company
      const { rows: leads } = await client.query(`
        SELECT id, stage FROM lead_pipeline 
        WHERE company_id = $1
      `, [calderas.id]);
      
      console.log(`Found ${leads.length} leads for ${calderas.name}:`, leads);
      
      if (leads.length > 0) {
        console.log(`Lead ID for reset: ${leads[0].id}`);
      }
    } else {
      console.log('❌ No Calderas company found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

updateCalderasPhone();