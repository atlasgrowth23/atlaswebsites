import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://postgres.zjxvacezqbhyomrngynq:Whodat10$Matheos23$@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true",
  ssl: { rejectUnauthorized: false }
});

const indexes = [
  // Template Views indexes
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_company_id ON template_views(company_id);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_session_id ON template_views(session_id);", 
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_created_at ON template_views(created_at DESC);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_company_date ON template_views(company_id, created_at DESC);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_visit_start ON template_views(visit_start_time DESC);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_template_views_analytics ON template_views(company_id, session_id, total_time_seconds, visit_start_time DESC);",
  
  // Companies indexes
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_state ON companies(state);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_slug ON companies(slug);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_state_city ON companies(state, city);",
  
  // Company frames indexes
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_company_id ON company_frames(company_id);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_slug ON company_frames(slug);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_frames_lookup ON company_frames(company_id, slug);",
  
  // Template frames indexes
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_frames_template_key ON frames(template_key);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_frames_slug ON frames(slug);",
  "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_frames_lookup ON frames(template_key, slug);"
];

async function runIndexes() {
  console.log('🚀 Starting database index creation...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < indexes.length; i++) {
    const indexSql = indexes[i];
    try {
      console.log(`📋 [${i + 1}/${indexes.length}] Creating index...`);
      await pool.query(indexSql);
      console.log(`✅ Success: ${indexSql.split(' ')[5]}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      errorCount++;
    }
  }
  
  console.log(`\n🎉 Index creation complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  await pool.end();
}

runIndexes().catch(console.error);