const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugTags() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Debugging tags system...\n');
    
    // Check the table structure
    console.log('1. Tag definitions table structure:');
    const { rows: tagDefStructure } = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tag_definitions'
      ORDER BY ordinal_position
    `);
    tagDefStructure.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    console.log('\n2. Lead tags table structure:');
    const { rows: leadTagsStructure } = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'lead_tags'
      ORDER BY ordinal_position
    `);
    leadTagsStructure.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
    });
    
    // Get a test lead ID
    console.log('\n3. Finding test leads:');
    const { rows: testLeads } = await client.query(`
      SELECT lp.id, c.name, lp.stage
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      WHERE lp.pipeline_type = 'atlas_test_pipeline'
      LIMIT 5
    `);
    
    console.log(`Found ${testLeads.length} test leads:`);
    testLeads.forEach(lead => {
      console.log(`  ${lead.id}: ${lead.name} (${lead.stage})`);
    });
    
    if (testLeads.length > 0) {
      const testLeadId = testLeads[0].id;
      
      // Check if this lead has any tags
      console.log(`\n4. Checking tags for lead ${testLeadId}:`);
      const { rows: leadTags } = await client.query(`
        SELECT 
          lt.id,
          lt.tag_type,
          lt.tag_value,
          lt.is_auto_generated,
          lt.created_at,
          lt.created_by,
          td.display_name,
          td.color,
          td.description
        FROM lead_tags lt
        LEFT JOIN tag_definitions td ON lt.tag_type = td.tag_type
        WHERE lt.lead_id = $1
      `, [testLeadId]);
      
      if (leadTags.length === 0) {
        console.log('  No tags found for this lead');
        
        // Add a test tag
        console.log('\n5. Adding test tag...');
        await client.query(`
          INSERT INTO lead_tags (lead_id, tag_type, tag_value, is_auto_generated, created_by)
          VALUES ($1, 'answered-call', 'answered-call', true, 'system')
        `, [testLeadId]);
        
        // Try again
        const { rows: newTags } = await client.query(`
          SELECT 
            lt.id,
            lt.tag_type,
            lt.tag_value,
            lt.is_auto_generated,
            lt.created_at,
            td.display_name,
            td.color
          FROM lead_tags lt
          LEFT JOIN tag_definitions td ON lt.tag_type = td.tag_type
          WHERE lt.lead_id = $1
        `, [testLeadId]);
        
        console.log('  Test tag added:');
        newTags.forEach(tag => {
          console.log(`    ${tag.tag_type}: ${tag.display_name} (${tag.color})`);
        });
      } else {
        console.log('  Found tags:');
        leadTags.forEach(tag => {
          console.log(`    ${tag.tag_type}: ${tag.display_name} (${tag.color})`);
        });
      }
      
      // Test the exact query from the API
      console.log('\n6. Testing API-style query:');
      const { rows: apiQuery } = await client.query(`
        SELECT 
          lt.id,
          lt.tag_type,
          lt.tag_value,
          lt.is_auto_generated,
          lt.created_at,
          lt.created_by,
          lt.metadata,
          td.display_name,
          td.color_class,
          td.description
        FROM lead_tags lt
        LEFT JOIN tag_definitions td ON lt.tag_type = td.tag_type
        WHERE lt.lead_id = $1
        ORDER BY lt.created_at DESC
      `, [testLeadId]);
      
      console.log('API-style query result:');
      if (apiQuery.length === 0) {
        console.log('  No results (this is the problem!)');
      } else {
        apiQuery.forEach(tag => {
          console.log(`  ${tag.tag_type}: display="${tag.display_name}", color_class="${tag.color_class}"`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

debugTags();