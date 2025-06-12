const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createAdminSettingsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Creating admin_settings table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_settings (
        key TEXT PRIMARY KEY,
        value JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✓ Table created');
    
    // Insert default settings
    await client.query(`
      INSERT INTO admin_settings (key, value) 
      VALUES 
        ('team_calendar_id', 'null'::jsonb),
        ('demo_mode', 'false'::jsonb)
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('✓ Default settings inserted');
    
    // Verify
    const result = await client.query('SELECT * FROM admin_settings ORDER BY key');
    console.log('📊 Current settings:');
    result.rows.forEach(row => {
      console.log(`  ${row.key}: ${JSON.stringify(row.value)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminSettingsTable().catch(console.error);