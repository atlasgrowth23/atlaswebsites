const { Client } = require('pg');

async function cleanupOldTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('🔍 Connected to database for cleanup...\n');

    // Step 1: Backup old HVAC data (just log what we're deleting)
    console.log('📋 BACKING UP OLD HVAC DATA SUMMARY:');
    
    const oldTables = ['hvac_contacts', 'hvac_conversations', 'hvac_messages', 'hvac_contact_activities', 'hvac_customers'];
    
    for (const tableName of oldTables) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
        const countResult = await client.query(countQuery);
        const rowCount = parseInt(countResult.rows[0].count);
        console.log(`📊 ${tableName}: ${rowCount} rows will be deleted`);
      } catch (error) {
        console.log(`⚠️  ${tableName}: Table doesn't exist or error - ${error.message.split('\n')[0]}`);
      }
    }

    // Check plumbers table
    try {
      const plumbersCount = await client.query('SELECT COUNT(*) as count FROM plumbers;');
      console.log(`📊 plumbers: ${plumbersCount.rows[0].count} rows will be deleted`);
    } catch (error) {
      console.log(`⚠️  plumbers: Table doesn't exist or error`);
    }

    console.log('\n✅ KEEPING AtlasHVAC tables:');
    const atlasKeepTables = ['atlashvac_contacts', 'atlashvac_equipment', 'atlashvac_equipment_photos', 'atlashvac_jobs', 'atlashvac_service_notes'];
    
    for (const tableName of atlasKeepTables) {
      try {
        const countQuery = `SELECT COUNT(*) as count FROM "${tableName}";`;
        const countResult = await client.query(countQuery);
        const rowCount = parseInt(countResult.rows[0].count);
        console.log(`🔵 ${tableName}: ${rowCount} rows (KEEPING)`);
      } catch (error) {
        console.log(`⚠️  ${tableName}: Table doesn't exist`);
      }
    }

    console.log('\n🗑️  STARTING DELETION...\n');

    // Step 2: Delete old HVAC tables
    const tablesToDrop = [
      'hvac_contact_activities',  // Delete dependencies first
      'hvac_messages',
      'hvac_conversations', 
      'hvac_contacts',
      'hvac_customers',
      'plumbers'  // Add plumbers table
    ];

    for (const tableName of tablesToDrop) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`);
        console.log(`✅ Deleted table: ${tableName}`);
      } catch (error) {
        console.log(`❌ Error deleting ${tableName}: ${error.message.split('\n')[0]}`);
      }
    }

    console.log('\n🎉 CLEANUP COMPLETE!');
    console.log('✅ Old HVAC system tables deleted');
    console.log('✅ Plumbers table deleted');
    console.log('✅ AtlasHVAC tables preserved');

    // Final verification
    console.log('\n📊 FINAL TABLE COUNT:');
    const finalTablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND (table_name LIKE 'hvac%' OR table_name LIKE 'atlashvac%' OR table_name = 'plumbers')
      ORDER BY table_name;
    `;
    
    const finalResult = await client.query(finalTablesQuery);
    if (finalResult.rows.length === 0) {
      console.log('⚠️  No HVAC or plumber tables found');
    } else {
      console.log('Remaining HVAC-related tables:');
      finalResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await client.end();
  }
}

cleanupOldTables().catch(console.error);