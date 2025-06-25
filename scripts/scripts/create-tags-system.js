const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTagsSystem() {
  const client = await pool.connect();
  
  try {
    console.log('🏷️  Creating tags system...\n');

    // Create lead_tags table
    console.log('1. Creating lead_tags table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_tags (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lead_id UUID NOT NULL REFERENCES lead_pipeline(id) ON DELETE CASCADE,
        tag_type VARCHAR(50) NOT NULL,
        tag_value VARCHAR(100) NOT NULL,
        is_auto_generated BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(50),
        metadata JSONB DEFAULT '{}'
      )
    `);

    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lead_tags_lead_id ON lead_tags(lead_id);
      CREATE INDEX IF NOT EXISTS idx_lead_tags_type ON lead_tags(tag_type);
      CREATE INDEX IF NOT EXISTS idx_lead_tags_value ON lead_tags(tag_value);
    `);

    console.log('✅ lead_tags table created with indexes');

    // Create tag definitions table for consistency
    console.log('\n2. Creating tag_definitions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tag_definitions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tag_type VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        color_class VARCHAR(50) NOT NULL,
        description TEXT,
        is_auto_tag BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    console.log('✅ tag_definitions table created');

    // Insert predefined tag definitions
    console.log('\n3. Inserting predefined tag definitions...');
    const tagDefinitions = [
      {
        tag_type: 'answered-call',
        display_name: 'Answered Call',
        color_class: 'bg-green-100 text-green-800',
        description: 'Customer answered the phone call',
        is_auto_tag: true
      },
      {
        tag_type: 'voicemail-left',
        display_name: 'Voicemail Left',
        color_class: 'bg-blue-100 text-blue-800',
        description: 'Left voicemail message',
        is_auto_tag: true
      },
      {
        tag_type: 'viewed-during-call',
        display_name: 'Viewed During Call',
        color_class: 'bg-purple-100 text-purple-800',
        description: 'Visited website while on phone call',
        is_auto_tag: true
      },
      {
        tag_type: 'viewed-after-voicemail',
        display_name: 'Viewed After Voicemail',
        color_class: 'bg-indigo-100 text-indigo-800',
        description: 'Visited website after voicemail was left',
        is_auto_tag: true
      },
      {
        tag_type: 'return-visitor',
        display_name: 'Return Visitor',
        color_class: 'bg-orange-100 text-orange-800',
        description: 'Multiple website visits',
        is_auto_tag: true
      },
      {
        tag_type: 'callback-received',
        display_name: 'Callback Received',
        color_class: 'bg-yellow-100 text-yellow-800',
        description: 'Customer called back',
        is_auto_tag: false
      }
    ];

    for (const tag of tagDefinitions) {
      await client.query(`
        INSERT INTO tag_definitions (tag_type, display_name, color_class, description, is_auto_tag)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (tag_type) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          color_class = EXCLUDED.color_class,
          description = EXCLUDED.description,
          is_auto_tag = EXCLUDED.is_auto_tag
      `, [tag.tag_type, tag.display_name, tag.color_class, tag.description, tag.is_auto_tag]);
    }

    console.log('✅ Tag definitions inserted');

    // Test the system
    console.log('\n4. Testing tags system...');
    
    // Get a sample lead
    const sampleLead = await client.query(`
      SELECT id FROM lead_pipeline LIMIT 1
    `);

    if (sampleLead.rows.length > 0) {
      const leadId = sampleLead.rows[0].id;
      
      // Add test tags
      await client.query(`
        INSERT INTO lead_tags (lead_id, tag_type, tag_value, is_auto_generated, created_by)
        VALUES 
          ($1, 'answered-call', 'answered-call', true, 'system'),
          ($1, 'return-visitor', 'return-visitor', true, 'system')
      `, [leadId]);

      // Query tags with definitions
      const tagsResult = await client.query(`
        SELECT 
          lt.tag_type,
          lt.tag_value,
          lt.is_auto_generated,
          lt.created_at,
          td.display_name,
          td.color_class,
          td.description
        FROM lead_tags lt
        JOIN tag_definitions td ON lt.tag_type = td.tag_type
        WHERE lt.lead_id = $1
      `, [leadId]);

      console.log('📊 Test tags for lead:');
      tagsResult.rows.forEach(tag => {
        console.log(`   ${tag.display_name} (${tag.color_class}) - Auto: ${tag.is_auto_generated}`);
      });

      // Clean up test data
      await client.query(`DELETE FROM lead_tags WHERE lead_id = $1`, [leadId]);
    }

    console.log('\n🎉 Tags system created successfully!');

  } catch (error) {
    console.error('❌ Tags system creation failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTagsSystem().catch(console.error);