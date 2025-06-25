const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function actuallyCleanSupabase() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 ACTUALLY CLEANING SUPABASE - REMOVING CLUTTER');
    console.log('='.repeat(60));
    
    // 1. REMOVE ALL BACKUP TABLES (CLUTTER)
    console.log('\n1️⃣ REMOVING BACKUP CLUTTER...');
    
    const backupTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%_backup_%'
    `);
    
    for (const row of backupTablesResult.rows) {
      const tableName = row.table_name;
      console.log(`   🗑️ Removing backup clutter: ${tableName}`);
      await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
    }
    console.log(`   ✅ Removed ${backupTablesResult.rows.length} backup tables`);
    
    // 2. REMOVE PROFESSIONAL MANAGEMENT CLUTTER
    console.log('\n2️⃣ REMOVING PROFESSIONAL MANAGEMENT CLUTTER...');
    
    const managementTables = [
      'change_requests',
      'database_migrations', 
      'database_backups',
      'environment_metadata',
      'environment_config',
      'feature_flags',
      'system_health_checks'
    ];
    
    for (const tableName of managementTables) {
      try {
        console.log(`   🗑️ Removing management clutter: ${tableName}`);
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
      } catch (error) {
        console.log(`   ⚠️ ${tableName} already gone or error: ${error.message}`);
      }
    }
    console.log('   ✅ Removed professional management clutter');
    
    // 3. CLEAN UP BUSINESS_PHOTOS TABLE
    console.log('\n3️⃣ CLEANING BUSINESS_PHOTOS TABLE...');
    
    // First check what columns exist
    const columnsResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'business_photos' 
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('   📊 Current columns:');
    columnsResult.rows.forEach(row => {
      console.log(`      - ${row.column_name}`);
    });
    
    // Create clean business_photos table
    console.log('   🔄 Creating clean business_photos table...');
    
    await client.query(`
      CREATE TABLE business_photos_clean AS
      SELECT 
        id,
        company_id,
        original_url,
        created_at
      FROM business_photos
    `);
    
    // Drop old table and rename
    await client.query(`DROP TABLE business_photos CASCADE`);
    await client.query(`ALTER TABLE business_photos_clean RENAME TO business_photos`);
    
    // Add constraints back
    await client.query(`
      ALTER TABLE business_photos 
      ADD CONSTRAINT business_photos_pkey PRIMARY KEY (id)
    `);
    
    const cleanCount = await client.query('SELECT COUNT(*) as count FROM business_photos');
    console.log(`   ✅ business_photos cleaned: ${cleanCount.rows[0].count} rows with only essential columns`);
    
    // 4. CHECK WHAT'S LEFT
    console.log('\n4️⃣ FINAL SUPABASE TABLE LIST...');
    
    const finalTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('   📊 REMAINING TABLES:');
    for (const row of finalTablesResult.rows) {
      const tableName = row.table_name;
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
        const count = parseInt(countResult.rows[0].count);
        console.log(`      ✅ ${tableName}: ${count} rows`);
      } catch (e) {
        console.log(`      ❓ ${tableName}: unknown`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUPABASE ACTUALLY CLEAN NOW!');
    console.log('='.repeat(60));
    
    console.log('\n✅ CLUTTER REMOVED:');
    console.log(`   🗑️ ${backupTablesResult.rows.length} backup tables deleted`);
    console.log('   🗑️ Professional management tables deleted');
    console.log('   🧹 business_photos simplified to essentials only');
    
    console.log('\n🎯 YOUR SUPABASE NOW HAS:');
    console.log('   ✅ lead_pipeline (consolidated)');
    console.log('   ✅ companies (business data)');
    console.log('   ✅ business_owners (contact info)');
    console.log('   ✅ business_photos (clean - just company_id + url)');
    console.log('   ✅ Essential operational tables');
    console.log('   ❌ NO MORE CLUTTER!');
    
    console.log('\n💡 RESULT: ACTUALLY CLEAN SUPABASE INTERFACE!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

actuallyCleanSupabase().catch(console.error);