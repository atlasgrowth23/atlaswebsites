const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function rebuildDatabaseLikeAPro() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 REBUILDING DATABASE LIKE A TRUE PRO');
    console.log('='.repeat(60));
    console.log('Since you only have 5 people with notes, let\'s start fresh!');
    
    // 1. ANALYZE WHAT'S ACTUALLY BEING USED
    console.log('\n1️⃣ ANALYZING WHAT YOU ACTUALLY USE...');
    
    const tables = ['companies', 'lead_pipeline', 'business_owners', 'appointments', 'conversations'];
    
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
        const count = parseInt(result.rows[0].count);
        
        if (count > 0) {
          console.log(`   📊 ${table}: ${count} rows`);
          
          // Check if it has real data or just test junk
          if (table === 'lead_pipeline') {
            const notesResult = await client.query(`
              SELECT COUNT(*) as with_notes 
              FROM lead_pipeline 
              WHERE notes_json IS NOT NULL 
                AND jsonb_array_length(notes_json) > 0
            `);
            console.log(`      👤 ${notesResult.rows[0].with_notes} actually have notes`);
          }
          
          if (table === 'companies') {
            const realCompanies = await client.query(`
              SELECT COUNT(*) as real_companies
              FROM companies 
              WHERE phone IS NOT NULL 
                OR email_1 IS NOT NULL
            `);
            console.log(`      📞 ${realCompanies.rows[0].real_companies} have contact info`);
          }
        } else {
          console.log(`   📊 ${table}: EMPTY`);
        }
      } catch (error) {
        console.log(`   ❌ ${table}: Doesn't exist`);
      }
    }
    
    console.log('\n2️⃣ WHAT A PRO WOULD DO...');
    console.log('   🎯 Keep only: companies + leads (one simple table)');
    console.log('   🎯 Everything else in JSON (notes, tags, contact info)');
    console.log('   🎯 Dead simple structure');
    console.log('   🎯 No bullshit extra tables');
    
    // 2. CREATE THE ULTIMATE PRO STRUCTURE
    console.log('\n3️⃣ CREATING ULTIMATE PRO DATABASE...');
    
    console.log('   🏗️ Creating simple, powerful structure...');
    
    // Create the ONE table you actually need for leads
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads_pro (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Company Info (everything in one place)
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        email VARCHAR(255),
        website VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(100),
        
        -- Lead Status (simple)
        stage VARCHAR(50) DEFAULT 'new',
        last_contact DATE,
        next_follow_up DATE,
        
        -- Everything else in JSON (pro move)
        notes JSONB DEFAULT '[]'::jsonb,
        tags JSONB DEFAULT '[]'::jsonb,
        contact_info JSONB DEFAULT '{}'::jsonb,
        analytics JSONB DEFAULT '{}'::jsonb,
        
        -- Timestamps
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('   ✅ Created leads_pro table (everything you need in one place)');
    
    // Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_pro_stage ON leads_pro(stage);
      CREATE INDEX IF NOT EXISTS idx_leads_pro_company ON leads_pro(company_name);
      CREATE INDEX IF NOT EXISTS idx_leads_pro_phone ON leads_pro(phone);
      CREATE INDEX IF NOT EXISTS idx_leads_pro_notes ON leads_pro USING gin(notes);
      CREATE INDEX IF NOT EXISTS idx_leads_pro_tags ON leads_pro USING gin(tags);
    `);
    
    console.log('   ✅ Added performance indexes');
    
    // 3. MIGRATE YOUR 5 REAL LEADS
    console.log('\n4️⃣ MIGRATING YOUR REAL DATA...');
    
    const migrationResult = await client.query(`
      INSERT INTO leads_pro (
        company_name, phone, email, city, state, stage, 
        notes, contact_info, created_at
      )
      SELECT 
        c.name as company_name,
        c.phone,
        c.email_1 as email,
        c.city,
        c.state,
        COALESCE(lp.stage, 'new') as stage,
        COALESCE(lp.notes_json, '[]'::jsonb) as notes,
        jsonb_build_object(
          'owner_name', bo.name,
          'owner_email', bo.email,
          'rating', c.rating,
          'reviews', c.reviews
        ) as contact_info,
        COALESCE(lp.created_at, c.created_at) as created_at
      FROM companies c
      LEFT JOIN lead_pipeline lp ON c.id = lp.company_id
      LEFT JOIN business_owners bo ON c.id = bo.company_id
      WHERE c.phone IS NOT NULL 
         OR c.email_1 IS NOT NULL
         OR lp.id IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
    
    console.log(`   ✅ Migrated ${migrationResult.rowCount} real leads`);
    
    // 4. CHECK THE BEAUTIFUL RESULT
    console.log('\n5️⃣ YOUR NEW PRO DATABASE...');
    
    const finalCount = await client.query('SELECT COUNT(*) as count FROM leads_pro');
    console.log(`   🎯 leads_pro: ${finalCount.rows[0].count} real leads`);
    
    const withNotes = await client.query(`
      SELECT COUNT(*) as count 
      FROM leads_pro 
      WHERE jsonb_array_length(notes) > 0
    `);
    console.log(`   📝 ${withNotes.rows[0].count} leads have notes`);
    
    // 5. OPTIONAL: NUKE EVERYTHING ELSE
    console.log('\n6️⃣ READY TO NUKE OLD CLUTTER?');
    console.log('   💣 Want to drop ALL old tables and keep only leads_pro?');
    console.log('   💣 This would give you the cleanest possible Supabase');
    console.log('   💣 Just one table: leads_pro with everything you need');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 PRO DATABASE STRUCTURE READY!');
    console.log('='.repeat(60));
    
    console.log('\n✅ WHAT YOU NOW HAVE:');
    console.log('   🎯 ONE table: leads_pro');
    console.log('   🎯 Company info + lead status + JSON data');
    console.log('   🎯 Notes, tags, contact info all in JSON');
    console.log('   🎯 Lightning fast with proper indexes');
    console.log('   🎯 Dead simple to work with');
    
    console.log('\n🚀 PRO BENEFITS:');
    console.log('   ⚡ Single table = simple queries');
    console.log('   📊 JSON = flexible data structure');
    console.log('   🔍 Proper indexes = fast performance');
    console.log('   🧹 Clean Supabase interface');
    
    console.log('\n🔥 WANT TO GO NUCLEAR?');
    console.log('   Run the nuke script to drop everything else');
    console.log('   and have the cleanest database possible!');
    
  } catch (error) {
    console.error('❌ Error rebuilding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

rebuildDatabaseLikeAPro().catch(console.error);