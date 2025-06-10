const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function analyzeBusinessOwnersMess() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 BUSINESS_OWNERS TABLE ANALYSIS - IS THIS JACKED UP?');
    console.log('='.repeat(70));
    
    // 1. Check what's in business_owners
    console.log('\n📊 BUSINESS_OWNERS DATA:');
    const businessOwners = await client.query(`
      SELECT bo.*, c.name as company_name, c.state
      FROM business_owners bo
      LEFT JOIN companies c ON bo.company_id = c.id
      ORDER BY bo.created_at DESC
    `);
    
    businessOwners.rows.forEach((row, index) => {
      console.log(`\n--- Business Owner ${index + 1} ---`);
      console.log(`   Name: ${row.name}`);
      console.log(`   Email: ${row.email}`);
      console.log(`   Company: ${row.company_name} (${row.state})`);
      console.log(`   Auth Provider: ${row.auth_provider}`);
      console.log(`   Provider ID: ${row.provider_id}`);
      console.log(`   Last Login: ${row.last_login}`);
      console.log(`   Created: ${row.created_at}`);
    });
    
    // 2. Check if business_owners companies are in lead_pipeline
    console.log('\n🔍 ARE THESE COMPANIES IN LEAD_PIPELINE?');
    for (const owner of businessOwners.rows) {
      const pipelineLead = await client.query(`
        SELECT stage, owner_name, owner_email, created_at
        FROM lead_pipeline 
        WHERE company_id = $1
      `, [owner.company_id]);
      
      if (pipelineLead.rows.length > 0) {
        const lead = pipelineLead.rows[0];
        console.log(`\n   ✅ ${owner.company_name}:`);
        console.log(`      Business Owner: ${owner.name} (${owner.email})`);
        console.log(`      Pipeline Owner: ${lead.owner_name} (${lead.owner_email})`);
        console.log(`      Stage: ${lead.stage}`);
        console.log(`      Pipeline Created: ${lead.created_at}`);
        console.log(`      Business Owner Created: ${owner.created_at}`);
        
        // Check if data matches
        if (owner.email === lead.owner_email) {
          console.log(`      ✅ Email matches`);
        } else {
          console.log(`      ❌ Email mismatch!`);
        }
      } else {
        console.log(`\n   ❌ ${owner.company_name}: NOT in pipeline!`);
      }
    }
    
    // 3. What does auth_provider = "pipeline_contact" mean?
    console.log('\n🤔 WHAT IS "pipeline_contact" AUTH PROVIDER?');
    const authProviders = await client.query(`
      SELECT auth_provider, COUNT(*) as count
      FROM business_owners 
      GROUP BY auth_provider
    `);
    
    authProviders.rows.forEach(row => {
      console.log(`   ${row.auth_provider}: ${row.count} entries`);
    });
    
    // 4. Check if business_owners is being used anywhere
    console.log('\n🔍 IS BUSINESS_OWNERS USED IN THE CODE?');
    console.log('   Need to grep codebase for business_owners usage...');
    
    // 5. Recommendation
    console.log('\n🎯 ANALYSIS RESULTS:');
    
    if (businessOwners.rows.length === 0) {
      console.log('   ❌ business_owners table is EMPTY - can be deleted');
    } else {
      console.log(`   📊 ${businessOwners.rows.length} business owners found`);
      console.log('   🔍 Checking if this data duplicates lead_pipeline...');
      
      let duplicateCount = 0;
      for (const owner of businessOwners.rows) {
        const duplicate = await client.query(`
          SELECT id FROM lead_pipeline 
          WHERE company_id = $1 AND owner_email = $2
        `, [owner.company_id, owner.email]);
        
        if (duplicate.rows.length > 0) {
          duplicateCount++;
        }
      }
      
      console.log(`   📈 ${duplicateCount}/${businessOwners.rows.length} business owners are duplicated in lead_pipeline`);
      
      if (duplicateCount === businessOwners.rows.length) {
        console.log('   ✅ ALL business_owners data exists in lead_pipeline - table is REDUNDANT');
      } else {
        console.log('   ⚠️ Some business_owners data is unique - need careful migration');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

analyzeBusinessOwnersMess();