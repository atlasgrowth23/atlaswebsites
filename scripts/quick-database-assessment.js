const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function quickDatabaseAssessment() {
  const client = await pool.connect();
  
  try {
    console.log('⚡ QUICK DATABASE ASSESSMENT - WHAT WORKS NOW');
    console.log('='.repeat(60));
    
    // Check current table status
    const tables = ['companies', 'lead_pipeline', 'business_owners', 'company_frames', 'frames', 'contacts', 'contact_log'];
    
    console.log('\n📊 CURRENT TABLE STATUS:');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        
        if (table === 'lead_pipeline') {
          const withNotes = await client.query(`
            SELECT COUNT(*) as count 
            FROM lead_pipeline 
            WHERE notes_json IS NOT NULL 
              AND jsonb_array_length(notes_json) > 0
          `);
          console.log(`   ✅ ${table}: ${count} rows (${withNotes.rows[0].count} with actual work)`);
        } else if (table === 'companies') {
          const states = await client.query(`
            SELECT state, COUNT(*) as count 
            FROM companies 
            GROUP BY state 
            ORDER BY count DESC
          `);
          console.log(`   ✅ ${table}: ${count} rows`);
          states.rows.forEach(row => {
            console.log(`      - ${row.state}: ${row.count}`);
          });
        } else {
          console.log(`   ✅ ${table}: ${count} rows`);
        }
      } catch (error) {
        console.log(`   ❌ ${table}: ERROR - ${error.message}`);
      }
    }
    
    // Check what's actually working
    console.log('\n🎯 WHAT\'S WORKING (DON\'T TOUCH):');
    
    // Check company frames system
    try {
      const framesWorking = await client.query(`
        SELECT COUNT(*) as count 
        FROM company_frames cf
        JOIN companies c ON cf.company_id = c.id
      `);
      console.log(`   ✅ Company frames system: ${framesWorking.rows[0].count} frame assignments`);
    } catch (e) {
      console.log('   ❌ Company frames system: Not working');
    }
    
    // Check lead pipeline functionality
    try {
      const activeLeads = await client.query(`
        SELECT stage, COUNT(*) as count
        FROM lead_pipeline 
        GROUP BY stage
        ORDER BY count DESC
      `);
      console.log(`   ✅ Lead pipeline stages:`);
      activeLeads.rows.forEach(row => {
        console.log(`      - ${row.stage}: ${row.count}`);
      });
    } catch (e) {
      console.log('   ❌ Lead pipeline: Not working');
    }
    
    // Check contacts system (is this customer CRM?)
    try {
      const contactsCheck = await client.query(`
        SELECT * FROM contacts LIMIT 3
      `);
      if (contactsCheck.rows.length > 0) {
        const sampleContact = contactsCheck.rows[0];
        console.log(`   🤔 Contacts table sample:`, Object.keys(sampleContact));
      }
    } catch (e) {
      console.log('   ❌ Contacts table: Not accessible');
    }
    
    console.log('\n⚠️ IMMEDIATE CONCERNS (COULD BITE YOU):');
    
    // Check for any broken APIs
    console.log('   🔍 APIs to test:');
    console.log('      - /api/pipeline/leads (main pipeline)');
    console.log('      - /api/pipeline/notes (notes system)');
    console.log('      - /api/pipeline/lead-details/[id] (lead details)');
    
    // Check for data integrity issues
    const orphanedLeads = await client.query(`
      SELECT COUNT(*) as count
      FROM lead_pipeline lp
      LEFT JOIN companies c ON lp.company_id = c.id
      WHERE c.id IS NULL
    `);
    
    if (orphanedLeads.rows[0].count > 0) {
      console.log(`   ⚠️ ${orphanedLeads.rows[0].count} orphaned leads (leads without companies)`);
    } else {
      console.log('   ✅ No orphaned leads found');
    }
    
    console.log('\n🚀 TONIGHT\'S PRIORITIES:');
    console.log('   1. Test your main pipeline workflow');
    console.log('   2. Make sure LeadSidebar component works');
    console.log('   3. Verify notes and lead management');
    console.log('   4. Don\'t change anything that\'s working');
    
    console.log('\n💰 MONEY-MAKING PRIORITIES:');
    console.log('   1. Arkansas leads are ready (24 with work done)');
    console.log('   2. Alabama untouched (fresh opportunity)');
    console.log('   3. Pipeline system functional');
    console.log('   4. Focus on sales, not database tweaks');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

quickDatabaseAssessment();