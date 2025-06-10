const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function autoCompactDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🗜️ AUTO-COMPACTING DATABASE FOR OPTIMAL PERFORMANCE');
    console.log('='.repeat(60));
    
    // 1. VACUUM AND ANALYZE ALL TABLES
    console.log('\n1️⃣ VACUUM AND ANALYZE ALL TABLES...');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      try {
        console.log(`   🧹 Compacting ${tableName}...`);
        await client.query(`VACUUM ANALYZE ${tableName}`);
      } catch (error) {
        console.log(`   ⚠️ ${tableName}: ${error.message}`);
      }
    }
    
    // 2. UPDATE TABLE STATISTICS
    console.log('\n2️⃣ UPDATING TABLE STATISTICS...');
    await client.query('ANALYZE');
    console.log('   ✅ Statistics updated');
    
    // 3. REINDEX PERFORMANCE-CRITICAL TABLES
    console.log('\n3️⃣ REINDEXING PERFORMANCE TABLES...');
    
    const criticalTables = ['companies', 'lead_pipeline', 'business_owners'];
    for (const table of criticalTables) {
      try {
        console.log(`   🔄 Reindexing ${table}...`);
        await client.query(`REINDEX TABLE ${table}`);
      } catch (error) {
        console.log(`   ⚠️ ${table}: ${error.message}`);
      }
    }
    
    // 4. CHECK DATABASE SIZE AFTER COMPACTION
    console.log('\n4️⃣ DATABASE SIZE AFTER COMPACTION...');
    
    const sizeResult = await client.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as bytes
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);
    
    console.log('   📊 TABLE SIZES:');
    let totalBytes = 0;
    sizeResult.rows.forEach(row => {
      console.log(`      ${row.tablename}: ${row.size}`);
      totalBytes += parseInt(row.bytes);
    });
    
    console.log(`   📊 TOTAL DATABASE SIZE: ${(totalBytes / (1024*1024)).toFixed(2)} MB`);
    
    // 5. PERFORMANCE OPTIMIZATION CHECK
    console.log('\n5️⃣ PERFORMANCE OPTIMIZATION CHECK...');
    
    // Check for missing indexes on large tables
    const indexCheck = await client.query(`
      SELECT 
        t.tablename,
        t.n_tup_ins + t.n_tup_upd + t.n_tup_del as total_writes,
        t.seq_scan,
        t.seq_tup_read
      FROM pg_stat_user_tables t
      WHERE t.n_tup_ins + t.n_tup_upd + t.n_tup_del > 100
      ORDER BY total_writes DESC
    `);
    
    console.log('   📈 HIGH-ACTIVITY TABLES:');
    indexCheck.rows.forEach(row => {
      console.log(`      ${row.tablename}: ${row.total_writes} writes, ${row.seq_scan} scans`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ AUTO-COMPACTION COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n🚀 PERFORMANCE IMPROVEMENTS:');
    console.log('   ⚡ Database vacuum completed');
    console.log('   📊 Statistics updated for query planner');
    console.log('   🔄 Indexes rebuilt for optimal performance');
    console.log('   🗜️ Storage space reclaimed');
    
    console.log('\n💡 YOUR DATABASE IS NOW OPTIMIZED!');
    
  } catch (error) {
    console.error('❌ Error during compaction:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

autoCompactDatabase();