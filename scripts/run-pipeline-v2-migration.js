// Create Pipeline v2 Database Schema
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

if (!process.env.DIRECT_URL) {
  console.error('❌ DIRECT_URL missing in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function createPipelineV2() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating Pipeline v2 database schema...');
    
    // Read the SQL file
    const sql = fs.readFileSync(
      path.join(__dirname, 'create-pipeline-v2-schema.sql'), 
      'utf8'
    );
    
    // Execute the schema
    await client.query(sql);
    
    console.log('✅ Pipeline v2 schema created successfully!');
    
    // Verify tables were created
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('business_types', 'regions', 'campaigns', 'pipeline_stages', 'leads', 'sms_messages', 'lead_activities', 'button_actions', 'admin_users_v2')
      ORDER BY table_name;
    `);
    
    console.log('📋 Created tables:', result.rows.map(r => r.table_name));
    
    // Check campaigns
    const campaigns = await client.query('SELECT id, name FROM campaigns');
    console.log('🏢 Created campaigns:');
    campaigns.rows.forEach(c => console.log(`  - ${c.name} (ID: ${c.id})`));
    
    // Check pipeline stages
    const stages = await client.query(`
      SELECT c.name as campaign_name, ps.name as stage_name, ps.order_index, ps.color
      FROM pipeline_stages ps
      JOIN campaigns c ON ps.campaign_id = c.id
      ORDER BY c.name, ps.order_index
    `);
    
    console.log('🎯 Created pipeline stages:');
    let currentCampaign = '';
    stages.rows.forEach(s => {
      if (s.campaign_name !== currentCampaign) {
        console.log(`\n  📊 ${s.campaign_name}:`);
        currentCampaign = s.campaign_name;
      }
      console.log(`    ${s.order_index}. ${s.stage_name} (${s.color})`);
    });
    
    console.log('\n🎉 Pipeline v2 setup complete!');
    console.log('\n🔗 Next steps:');
    console.log('  1. Build Admin v2 interface at /admin-v2');
    console.log('  2. Seed test leads for Alabama/Arkansas HVAC');
    console.log('  3. Build SMS composer and pipeline management');
    
  } catch (error) {
    console.error('❌ Error creating Pipeline v2:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
createPipelineV2().catch(console.error);