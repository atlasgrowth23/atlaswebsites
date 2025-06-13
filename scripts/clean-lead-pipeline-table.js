const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanLeadPipelineTable() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Cleaning up lead_pipeline table structure...\n');
    
    // 1. Add notes column to companies table if it doesn't exist
    console.log('1️⃣ Adding notes column to companies table...');
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    console.log('✅ Added notes column to companies table');
    
    // 2. Migrate notes from lead_pipeline to companies
    console.log('\n2️⃣ Migrating notes from lead_pipeline to companies...');
    
    // First migrate the old text notes
    const textNotesResult = await client.query(`
      UPDATE companies 
      SET notes = COALESCE(
        CASE 
          WHEN lp.notes IS NOT NULL AND lp.notes != '' AND lp.notes != 'Auto-added for photo extraction | Reset to new lead stage'
          THEN lp.notes
          ELSE NULL
        END, 
        companies.notes
      )
      FROM lead_pipeline lp 
      WHERE companies.id = lp.company_id 
      AND lp.notes IS NOT NULL 
      AND lp.notes != ''
      AND lp.notes != 'Auto-added for photo extraction | Reset to new lead stage'
    `);
    console.log(`✅ Migrated ${textNotesResult.rowCount} text notes to companies table`);
    
    // Then migrate JSON notes (convert to text)
    const jsonNotesResult = await client.query(`
      SELECT lp.company_id, lp.notes_json, c.name as company_name
      FROM lead_pipeline lp
      JOIN companies c ON c.id = lp.company_id
      WHERE lp.notes_json IS NOT NULL 
      AND jsonb_array_length(lp.notes_json) > 0
    `);
    
    for (const row of jsonNotesResult.rows) {
      const notes = row.notes_json;
      if (notes && notes.length > 0) {
        // Convert JSON notes to readable text
        const notesText = notes.map(note => 
          `${new Date(note.created_at).toLocaleDateString()} (${note.created_by}): ${note.content}`
        ).join('\n\n');
        
        await client.query(`
          UPDATE companies 
          SET notes = COALESCE(notes || E'\n\n' || $2, $2)
          WHERE id = $1
        `, [row.company_id, notesText]);
        
        console.log(`✅ Migrated ${notes.length} JSON notes for ${row.company_name}`);
      }
    }
    
    // 3. Show what we're about to delete
    console.log('\n3️⃣ Checking data to be deleted...');
    const ownerDataResult = await client.query(`
      SELECT COUNT(*) as count FROM lead_pipeline 
      WHERE owner_name IS NOT NULL OR owner_email IS NOT NULL
    `);
    console.log(`📊 Found ${ownerDataResult.rows[0].count} records with owner data (will be preserved in companies table)`);
    
    const tagsResult = await client.query(`
      SELECT COUNT(*) as count FROM lead_pipeline 
      WHERE tags IS NOT NULL AND jsonb_array_length(tags) > 0
    `);
    console.log(`📊 Found ${tagsResult.rows[0].count} records with tags (will be deleted)`);
    
    // 4. Delete the unnecessary columns
    console.log('\n4️⃣ Removing unnecessary columns from lead_pipeline...');
    
    await client.query('ALTER TABLE lead_pipeline DROP COLUMN IF EXISTS owner_name');
    console.log('✅ Dropped owner_name column');
    
    await client.query('ALTER TABLE lead_pipeline DROP COLUMN IF EXISTS owner_email');
    console.log('✅ Dropped owner_email column');
    
    await client.query('ALTER TABLE lead_pipeline DROP COLUMN IF EXISTS notes');
    console.log('✅ Dropped notes column');
    
    await client.query('ALTER TABLE lead_pipeline DROP COLUMN IF EXISTS notes_json');
    console.log('✅ Dropped notes_json column');
    
    await client.query('ALTER TABLE lead_pipeline DROP COLUMN IF EXISTS tags');
    console.log('✅ Dropped tags column');
    
    await client.query('ALTER TABLE lead_pipeline DROP COLUMN IF EXISTS business_owner_id');
    console.log('✅ Dropped business_owner_id column');
    
    // 5. Show final structure
    console.log('\n5️⃣ Final lead_pipeline table structure:');
    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'lead_pipeline' 
      ORDER BY ordinal_position;
    `);
    
    finalColumns.rows.forEach(col => {
      console.log(`  ✅ ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n🎉 Database cleanup complete!');
    console.log('📋 lead_pipeline now only contains pipeline-specific data');
    console.log('🏢 companies table contains all company data including notes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanLeadPipelineTable().catch(console.error);