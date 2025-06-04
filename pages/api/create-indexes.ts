import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabase';

const indexes = [
  "CREATE INDEX IF NOT EXISTS idx_template_views_company_id ON template_views(company_id);",
  "CREATE INDEX IF NOT EXISTS idx_template_views_session_id ON template_views(session_id);", 
  "CREATE INDEX IF NOT EXISTS idx_template_views_created_at ON template_views(created_at DESC);",
  "CREATE INDEX IF NOT EXISTS idx_template_views_company_date ON template_views(company_id, created_at DESC);",
  "CREATE INDEX IF NOT EXISTS idx_companies_state ON companies(state);",
  "CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);",
  "CREATE INDEX IF NOT EXISTS idx_company_frames_company_id ON company_frames(company_id);",
  "CREATE INDEX IF NOT EXISTS idx_company_frames_lookup ON company_frames(company_id, slug);"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚀 Starting index creation via Supabase...');
  
  let successCount = 0;
  let errorCount = 0;
  const results = [];

  for (let i = 0; i < indexes.length; i++) {
    const indexSql = indexes[i];
    try {
      console.log(`📋 [${i + 1}/${indexes.length}] Creating index...`);
      
      const { error } = await supabaseAdmin.rpc('exec_sql', { 
        sql: indexSql 
      });
      
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        results.push({ index: i + 1, status: 'error', error: error.message });
        errorCount++;
      } else {
        console.log(`✅ Success: Index ${i + 1}`);
        results.push({ index: i + 1, status: 'success' });
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception: ${err}`);
      results.push({ index: i + 1, status: 'exception', error: (err as Error).message });
      errorCount++;
    }
  }
  
  console.log(`\n🎉 Index creation complete!`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  return res.status(200).json({
    success: true,
    successCount,
    errorCount,
    results
  });
}