const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixTagsTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing tags table...');
    
    // Add missing columns if they don't exist
    try {
      await client.query(`ALTER TABLE tag_definitions ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT 'blue'`);
      await client.query(`ALTER TABLE tag_definitions ADD COLUMN IF NOT EXISTS is_auto_tag BOOLEAN DEFAULT false`);
      await client.query(`ALTER TABLE tag_definitions ADD COLUMN IF NOT EXISTS description TEXT`);
      console.log('✅ Added missing columns to tag_definitions');
    } catch (error) {
      console.log('Columns might already exist:', error.message);
    }
    
    // Fix lead_tags table too
    try {
      await client.query(`ALTER TABLE lead_tags ADD COLUMN IF NOT EXISTS tag_value VARCHAR(255)`);
      await client.query(`ALTER TABLE lead_tags ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN DEFAULT false`);
      console.log('✅ Added missing columns to lead_tags');
    } catch (error) {
      console.log('Columns might already exist:', error.message);
    }
    
    // Check current tag definitions
    const { rows: existingTags } = await client.query(`
      SELECT tag_type FROM tag_definitions
    `);
    
    const existingTagTypes = existingTags.map(t => t.tag_type);
    console.log('Existing tags:', existingTagTypes);
    
    // Add missing standard tags
    const standardTags = [
      { tag_type: 'answered-call', display_name: 'Answered Call', description: 'Lead answered the phone call', color: 'green', is_auto_tag: true },
      { tag_type: 'voicemail-left', display_name: 'Voicemail Left', description: 'Voicemail was left for this lead', color: 'blue', is_auto_tag: true },
      { tag_type: 'viewed-during-call', display_name: 'Viewed During Call', description: 'Website visited while on call', color: 'purple', is_auto_tag: true },
      { tag_type: 'viewed-after-voicemail', display_name: 'Viewed After Voicemail', description: 'Website visited after voicemail', color: 'indigo', is_auto_tag: true },
      { tag_type: 'return-visitor', display_name: 'Return Visitor', description: 'Visited website multiple times', color: 'orange', is_auto_tag: true }
    ];
    
    for (const tag of standardTags) {
      if (!existingTagTypes.includes(tag.tag_type)) {
        await client.query(`
          INSERT INTO tag_definitions (tag_type, display_name, description, color, is_auto_tag)
          VALUES ($1, $2, $3, $4, $5)
        `, [tag.tag_type, tag.display_name, tag.description, tag.color, tag.is_auto_tag]);
        console.log(`✅ Added tag: ${tag.tag_type}`);
      }
    }
    
    console.log('✅ Tags system is now properly configured!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTagsTable();