const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkNotesDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking notes database setup...');
    
    // Check if lead_notes table exists
    const notesTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_notes'
      );
    `);
    
    console.log(`\n📋 lead_notes table exists: ${notesTableCheck.rows[0].exists}`);
    
    if (notesTableCheck.rows[0].exists) {
      // Show table structure
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'lead_notes' 
        ORDER BY ordinal_position
      `);
      
      console.log('\n📋 lead_notes table structure:');
      structure.rows.forEach(row => {
        console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
      });
      
      // Check sample data
      const sampleData = await client.query(`
        SELECT COUNT(*) as total_notes FROM lead_notes
      `);
      console.log(`\n📊 Total notes in database: ${sampleData.rows[0].total_notes}`);
      
    } else {
      console.log('\n❌ lead_notes table does NOT exist! Creating it...');
      
      // Create the table
      await client.query(`
        CREATE TABLE lead_notes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          lead_id UUID NOT NULL,
          content TEXT NOT NULL,
          is_private BOOLEAN DEFAULT false,
          created_by VARCHAR(255) DEFAULT 'admin',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      
      console.log('✅ Created lead_notes table');
      
      // Create index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);
      `);
      
      console.log('✅ Created index on lead_id');
    }
    
    // Test a sample lead ID to see if notes work
    console.log('\n🧪 Testing notes functionality...');
    
    // Get a sample lead ID
    const sampleLead = await client.query(`
      SELECT id FROM lead_pipeline LIMIT 1
    `);
    
    if (sampleLead.rows.length > 0) {
      const leadId = sampleLead.rows[0].id;
      console.log(`📋 Testing with lead ID: ${leadId}`);
      
      // Try to fetch notes for this lead
      const notesCheck = await client.query(`
        SELECT * FROM lead_notes WHERE lead_id = $1
      `, [leadId]);
      
      console.log(`📊 Notes for this lead: ${notesCheck.rows.length}`);
    } else {
      console.log('❌ No leads found in lead_pipeline table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkNotesDatabase().catch(console.error);