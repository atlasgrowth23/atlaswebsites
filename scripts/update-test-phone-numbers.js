// Update test leads with actual phone number for testing
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

// Replace this with your actual phone number
const YOUR_PHONE_NUMBER = '+12055005170'; // Nick's actual number

async function updatePhoneNumbers() {
  const client = await pool.connect();
  
  try {
    console.log('📱 Updating test lead phone numbers...');
    
    const result = await client.query(`
      UPDATE leads 
      SET phone = $1
      WHERE phone = '+1YOUR_PHONE_NUMBER'
      RETURNING id, business_name, phone
    `, [YOUR_PHONE_NUMBER]);
    
    console.log(`✅ Updated ${result.rows.length} leads with phone number: ${YOUR_PHONE_NUMBER}`);
    
    result.rows.forEach(lead => {
      console.log(`  - ${lead.business_name}: ${lead.phone}`);
    });
    
    console.log('\n🎉 Ready to test! Next steps:');
    console.log('1. Visit /admin-v2/pipeline');
    console.log('2. Click on any lead in "New Lead" stage');
    console.log('3. Customize SMS message and send');
    console.log('4. Check your phone for the SMS');
    console.log('5. Click the link to test the video landing page');
    
  } catch (error) {
    console.error('❌ Error updating phone numbers:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

updatePhoneNumbers().catch(console.error);