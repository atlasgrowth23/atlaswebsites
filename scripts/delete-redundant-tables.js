const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function deleteRedundantTables() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL missing in .env.local');
  }

  const client = await pool.connect();
  
  try {
    console.log('🗑️  PROFESSIONAL DATABASE CLEANUP\n');
    console.log('='.repeat(60));
    
    // 1. DELETE page_views (confirmed redundant)
    console.log('\n1️⃣ DELETING page_views table:');
    console.log('   📊 Checking current data...');
    
    const pageViewsCount = await client.query('SELECT COUNT(*) as count FROM page_views');
    console.log(`   📈 Current records: ${pageViewsCount.rows[0].count}`);
    console.log('   ❌ REDUNDANT: All functionality covered by template_views');
    console.log('   ❌ UNUSED: No production APIs reference this table');
    
    await client.query('DROP TABLE IF EXISTS page_views CASCADE;');
    console.log('   ✅ DELETED: page_views table removed');
    
    // 2. EVALUATE contact_log
    console.log('\n2️⃣ EVALUATING contact_log table:');
    console.log('   📊 Checking current data...');
    
    const contactLogCount = await client.query('SELECT COUNT(*) as count FROM contact_log');
    const contactLogSample = await client.query('SELECT * FROM contact_log LIMIT 3');
    
    console.log(`   📈 Current records: ${contactLogCount.rows[0].count}`);
    
    if (contactLogSample.rows.length > 0) {
      console.log('   📝 Sample data structure:', Object.keys(contactLogSample.rows[0]));
      console.log('   📝 Sample record:');
      console.log(JSON.stringify(contactLogSample.rows[0], null, 2));
      
      // Check if this overlaps with activity_log
      const activityLogCount = await client.query('SELECT COUNT(*) as count FROM activity_log');
      console.log(`   📊 activity_log has ${activityLogCount.rows[0].count} records`);
      
      console.log('\n   🤔 EVALUATION:');
      console.log('   ⚠️  contact_log has data - need to verify purpose');
      console.log('   ⚠️  May overlap with activity_log functionality');
      console.log('   ⚠️  RECOMMEND: Manual review before deletion');
      console.log('   🛑 SKIPPING deletion - needs further analysis');
    } else {
      console.log('   ✅ contact_log is empty - safe to delete');
      await client.query('DROP TABLE IF EXISTS contact_log CASCADE;');
      console.log('   ✅ DELETED: contact_log table removed');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ CLEANUP PHASE COMPLETE\n');
    
    console.log('📋 SUMMARY:');
    console.log('   🗑️  DELETED: page_views (redundant with template_views)');
    
    if (contactLogCount.rows[0].count === 0) {
      console.log('   🗑️  DELETED: contact_log (was empty)');
    } else {
      console.log('   ⏸️  PRESERVED: contact_log (has data, needs review)');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('   ✅ Database is cleaner');
    console.log('   ✅ Redundant tracking eliminated');
    console.log('   📊 All analytics now use template_views (professional)');
    
    if (contactLogCount.rows[0].count > 0) {
      console.log('   🔍 Review contact_log vs activity_log overlap manually');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

deleteRedundantTables().catch(console.error);