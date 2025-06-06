const { Pool } = require('pg');
require('dotenv').config({ path: 'env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixNotesForeignKey() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing notes foreign key constraint...');
    
    // Check current constraint
    const constraintCheck = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'lead_notes'
        AND kcu.column_name = 'lead_id';
    `);
    
    console.log('\n📋 Current foreign key constraints on lead_notes.lead_id:');
    constraintCheck.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    // Drop the old constraint if it exists
    if (constraintCheck.rows.length > 0) {
      const constraintName = constraintCheck.rows[0].constraint_name;
      console.log(`\n🗑️ Dropping old constraint: ${constraintName}`);
      
      await client.query(`
        ALTER TABLE lead_notes DROP CONSTRAINT IF EXISTS ${constraintName};
      `);
      
      console.log('✅ Dropped old foreign key constraint');
    }
    
    // Add new constraint pointing to lead_pipeline table
    console.log('\n🔗 Adding new foreign key constraint to lead_pipeline...');
    
    await client.query(`
      ALTER TABLE lead_notes 
      ADD CONSTRAINT lead_notes_lead_id_fkey 
      FOREIGN KEY (lead_id) REFERENCES lead_pipeline(id) 
      ON DELETE CASCADE;
    `);
    
    console.log('✅ Added new foreign key constraint');
    
    // Verify the fix
    const verifyCheck = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'lead_notes'
        AND kcu.column_name = 'lead_id';
    `);
    
    console.log('\n✅ Updated foreign key constraints:');
    verifyCheck.rows.forEach(row => {
      console.log(`  ${row.constraint_name}: ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
    console.log('\n🎯 Foreign key fix complete! Notes should now save properly.');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixNotesForeignKey().catch(console.error);