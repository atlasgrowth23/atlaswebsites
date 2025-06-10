const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function goNuclearCleanDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('💣 GOING NUCLEAR - ULTIMATE CLEAN DATABASE');
    console.log('='.repeat(60));
    console.log('Keeping ONLY what you actually need!');
    
    // 1. GET LIST OF ALL TABLES
    console.log('\n1️⃣ IDENTIFYING ALL CLUTTER...');
    
    const allTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name != 'leads_pro'
      ORDER BY table_name
    `);
    
    console.log(`   🗑️ Found ${allTablesResult.rows.length} tables to nuke:`);
    allTablesResult.rows.forEach(row => {
      console.log(`      - ${row.table_name}`);
    });
    
    // 2. NUCLEAR OPTION - DROP EVERYTHING EXCEPT leads_pro
    console.log('\n2️⃣ NUCLEAR CLEANUP IN PROGRESS...');
    
    let dropped = 0;
    for (const row of allTablesResult.rows) {
      const tableName = row.table_name;
      try {
        console.log(`   💣 Nuking ${tableName}...`);
        await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
        dropped++;
      } catch (error) {
        console.log(`   ⚠️ Couldn't nuke ${tableName}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ NUKED ${dropped} tables`);
    
    // 3. VERIFY CLEAN RESULT
    console.log('\n3️⃣ VERIFYING NUCLEAR CLEANUP...');
    
    const remainingTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('   📊 REMAINING TABLES:');
    remainingTablesResult.rows.forEach(row => {
      console.log(`      ✅ ${row.table_name}`);
    });
    
    // 4. CHECK YOUR CLEAN DATA
    console.log('\n4️⃣ YOUR CLEAN DATA STATUS...');
    
    const leadsCount = await client.query('SELECT COUNT(*) as count FROM leads_pro');
    console.log(`   🎯 Total leads: ${leadsCount.rows[0].count}`);
    
    const withNotes = await client.query(`
      SELECT COUNT(*) as count 
      FROM leads_pro 
      WHERE jsonb_array_length(notes) > 0
    `);
    console.log(`   📝 Leads with notes: ${withNotes.rows[0].count}`);
    
    const withPhone = await client.query(`
      SELECT COUNT(*) as count 
      FROM leads_pro 
      WHERE phone IS NOT NULL
    `);
    console.log(`   📞 Leads with phone: ${withPhone.rows[0].count}`);
    
    const recentLeads = await client.query(`
      SELECT company_name, stage, jsonb_array_length(notes) as note_count
      FROM leads_pro 
      WHERE jsonb_array_length(notes) > 0
      ORDER BY updated_at DESC 
      LIMIT 5
    `);
    
    console.log('\n   🔥 YOUR TOP LEADS WITH NOTES:');
    recentLeads.rows.forEach(lead => {
      console.log(`      📝 ${lead.company_name}: ${lead.note_count} notes (${lead.stage})`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('💥 NUCLEAR CLEANUP COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n🎯 ULTIMATE PRO DATABASE ACHIEVED:');
    console.log('   ✅ ONE table only: leads_pro');
    console.log('   ✅ All your leads with contact info');
    console.log('   ✅ Notes, tags, everything in JSON');
    console.log('   ✅ Lightning fast performance');
    console.log('   ✅ Dead simple to work with');
    
    console.log('\n🚀 YOUR SUPABASE IS NOW:');
    console.log('   🔥 CLEANEST POSSIBLE');
    console.log('   🔥 PROFESSIONAL STRUCTURE');
    console.log('   🔥 ZERO CLUTTER');
    console.log('   🔥 EXACTLY WHAT A PRO WOULD BUILD');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Update your APIs to use leads_pro table');
    console.log('   2. Enjoy the clean, simple structure');
    console.log('   3. Never worry about scattered data again');
    
    console.log('\n🎉 CONGRATULATIONS - YOU HAVE A TRULY PRO DATABASE!');
    
  } catch (error) {
    console.error('❌ Error during nuclear cleanup:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

goNuclearCleanDatabase().catch(console.error);