const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkExistingArkansasWork() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 CHECKING EXISTING ARKANSAS WORK');
    console.log('='.repeat(50));
    
    // Check Arkansas companies
    const arkansasCompanies = await client.query(`
      SELECT COUNT(*) as count FROM companies WHERE state = 'Arkansas'
    `);
    console.log(`📊 Arkansas companies in database: ${arkansasCompanies.rows[0].count}`);
    
    // Check Arkansas leads with actual work done
    const arkansasLeads = await client.query(`
      SELECT COUNT(*) as count 
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id 
      WHERE c.state = 'Arkansas'
    `);
    console.log(`🎯 Arkansas leads in pipeline: ${arkansasLeads.rows[0].count}`);
    
    // Check Arkansas leads with notes
    const arkansasWithNotes = await client.query(`
      SELECT COUNT(*) as count 
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id 
      WHERE c.state = 'Arkansas' 
        AND lp.notes_json IS NOT NULL 
        AND jsonb_array_length(lp.notes_json) > 0
    `);
    console.log(`📝 Arkansas leads with notes: ${arkansasWithNotes.rows[0].count}`);
    
    // Show specific Arkansas companies with work done
    const workDone = await client.query(`
      SELECT c.name, c.city, lp.stage, jsonb_array_length(lp.notes_json) as note_count
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id 
      WHERE c.state = 'Arkansas' 
        AND lp.notes_json IS NOT NULL 
        AND jsonb_array_length(lp.notes_json) > 0
      ORDER BY jsonb_array_length(lp.notes_json) DESC
      LIMIT 10
    `);
    
    if (workDone.rows.length > 0) {
      console.log('\n📋 ARKANSAS COMPANIES WITH ACTUAL WORK:');
      workDone.rows.forEach(row => {
        console.log(`   🏢 ${row.name} (${row.city}) - ${row.note_count} notes - ${row.stage}`);
      });
    }
    
    console.log('\n🎯 RECOMMENDATION:');
    if (arkansasWithNotes.rows[0].count < 10) {
      console.log('   ✅ Very little Arkansas work done - safe to rebuild with new CSV');
      console.log('   🔄 Import new 2,331 businesses from Outscraper');
      console.log('   📦 Preserve the few existing notes/leads');
    } else {
      console.log('   ⚠️ Significant Arkansas work exists - need careful migration');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkExistingArkansasWork();