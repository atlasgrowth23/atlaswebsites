const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function setupPipeline() {
  // Try DIRECT_URL first (non-pooled connection)
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log('🔗 Using DIRECT_URL connection');
  console.log('🔗 Connection starts with:', connectionString?.substring(0, 20) + '...');
  
  const client = new Client({
    connectionString: connectionString
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    
    console.log('🏗️  Creating pipeline tables...');
    
    // Create the tables
    await client.query(`
      -- Lead Pipeline Table
      CREATE TABLE IF NOT EXISTS lead_pipeline (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        stage TEXT NOT NULL DEFAULT 'new_lead',
        last_contact_date TIMESTAMPTZ,
        next_follow_up_date TIMESTAMPTZ,
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id)
      );
    `);
    
    console.log('✅ lead_pipeline table created');

    // Contact log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contact_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        stage_from TEXT,
        stage_to TEXT NOT NULL,
        notes TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        created_by TEXT
      );
    `);
    
    console.log('✅ contact_log table created');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lead_pipeline_stage ON lead_pipeline(stage);
      CREATE INDEX IF NOT EXISTS idx_lead_pipeline_company ON lead_pipeline(company_id);
    `);
    
    console.log('✅ Indexes created');

    // Count existing companies
    const countResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas')
    `);
    
    const totalCompanies = parseInt(countResult.rows[0].count);
    console.log(`📊 Found ${totalCompanies} companies to add to pipeline`);

    // Populate with all companies as new leads
    const insertResult = await client.query(`
      INSERT INTO lead_pipeline (company_id, stage, notes)
      SELECT id, 'new_lead', ''
      FROM companies 
      WHERE state IN ('Alabama', 'Arkansas')
      ON CONFLICT (company_id) DO NOTHING
      RETURNING id;
    `);
    
    console.log(`✅ Added ${insertResult.rowCount} companies to pipeline`);

    // Verify the results
    const verifyResult = await client.query(`
      SELECT 
        stage,
        COUNT(*) as count
      FROM lead_pipeline lp
      JOIN companies c ON lp.company_id = c.id
      WHERE c.state IN ('Alabama', 'Arkansas')
      GROUP BY stage
      ORDER BY stage;
    `);
    
    console.log('📈 Pipeline summary:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.stage}: ${row.count} leads`);
    });

    console.log('🎉 Pipeline setup complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

setupPipeline();