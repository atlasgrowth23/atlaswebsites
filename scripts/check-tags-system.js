const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTagsSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🏷️ Checking tags system...');
    
    // Check if tag_definitions table exists
    const { rows: tableExists } = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tag_definitions'
      );
    `);
    
    if (!tableExists[0].exists) {
      console.log('❌ tag_definitions table does not exist');
      
      // Create tag_definitions table
      await client.query(`
        CREATE TABLE tag_definitions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tag_type VARCHAR(255) UNIQUE NOT NULL,
          display_name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(50) DEFAULT 'blue',
          is_auto_tag BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('✅ Created tag_definitions table');
      
      // Add standard tag definitions
      const standardTags = [
        { tag_type: 'answered-call', display_name: 'Answered Call', description: 'Lead answered the phone call', color: 'green', is_auto_tag: true },
        { tag_type: 'voicemail-left', display_name: 'Voicemail Left', description: 'Voicemail was left for this lead', color: 'blue', is_auto_tag: true },
        { tag_type: 'viewed-during-call', display_name: 'Viewed During Call', description: 'Website visited while on call', color: 'purple', is_auto_tag: true },
        { tag_type: 'viewed-after-voicemail', display_name: 'Viewed After Voicemail', description: 'Website visited after voicemail', color: 'indigo', is_auto_tag: true },
        { tag_type: 'return-visitor', display_name: 'Return Visitor', description: 'Visited website multiple times', color: 'orange', is_auto_tag: true },
        { tag_type: 'interested', display_name: 'Interested', description: 'Lead expressed interest', color: 'green', is_auto_tag: false },
        { tag_type: 'not-interested', display_name: 'Not Interested', description: 'Lead not interested', color: 'red', is_auto_tag: false },
        { tag_type: 'callback-requested', display_name: 'Callback Requested', description: 'Lead requested a callback', color: 'yellow', is_auto_tag: false }
      ];
      
      for (const tag of standardTags) {
        await client.query(`
          INSERT INTO tag_definitions (tag_type, display_name, description, color, is_auto_tag)
          VALUES ($1, $2, $3, $4, $5)
        `, [tag.tag_type, tag.display_name, tag.description, tag.color, tag.is_auto_tag]);
      }
      console.log(`✅ Added ${standardTags.length} standard tag definitions`);
      
    } else {
      console.log('✅ tag_definitions table exists');
      
      // Check what tags are defined
      const { rows: tags } = await client.query(`
        SELECT tag_type, display_name, color, is_auto_tag FROM tag_definitions ORDER BY tag_type
      `);
      
      console.log(`📋 Found ${tags.length} tag definitions:`);
      tags.forEach(tag => {
        console.log(`  ${tag.tag_type}: "${tag.display_name}" (${tag.color}, ${tag.is_auto_tag ? 'auto' : 'manual'})`);
      });
    }
    
    // Check current tags on leads
    const { rows: leadTags } = await client.query(`
      SELECT lt.tag_type, COUNT(*) as count, td.display_name, td.color
      FROM lead_tags lt
      LEFT JOIN tag_definitions td ON lt.tag_type = td.tag_type
      GROUP BY lt.tag_type, td.display_name, td.color
      ORDER BY count DESC
    `);
    
    console.log(`\n🏷️ Currently applied tags:`);
    if (leadTags.length === 0) {
      console.log('  No tags currently applied to any leads');
    } else {
      leadTags.forEach(tag => {
        console.log(`  ${tag.tag_type}: ${tag.count} leads (${tag.display_name || 'No definition'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkTagsSystem();